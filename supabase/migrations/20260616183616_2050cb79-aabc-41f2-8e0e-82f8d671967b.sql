
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles can be inserted by owner"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles can be updated by owner"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Roles
CREATE TYPE public.app_role AS ENUM ('customer', 'salon_owner', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link salons to owners
ALTER TABLE public.salons ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Salon owners can update their salons
CREATE POLICY "Owners can update their salons"
  ON public.salons FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Link bookings to users
ALTER TABLE public.bookings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;

-- Customers can see their own bookings
CREATE POLICY "Users can view their bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Salon owners can see and update bookings for their salons
CREATE POLICY "Owners can view bookings for their salons"
  ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.salons s WHERE s.id = bookings.salon_id AND s.owner_id = auth.uid()));

CREATE POLICY "Owners can update bookings for their salons"
  ON public.bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.salons s WHERE s.id = bookings.salon_id AND s.owner_id = auth.uid()));

-- Authenticated users can insert bookings linking themselves
CREATE POLICY "Auth users can insert their own bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND length(trim(customer_name)) BETWEEN 2 AND 80
    AND length(trim(customer_phone)) BETWEEN 7 AND 20
    AND length(trim(service_name)) BETWEEN 1 AND 120
    AND booking_date >= CURRENT_DATE
    AND status = 'pending'
  );
