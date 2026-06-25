
-- Admin policies on salons
CREATE POLICY "Admins manage all salons" ON public.salons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin policies on bookings
CREATE POLICY "Admins view all bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete bookings" ON public.bookings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies on profiles
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies on user_roles
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND user_id <> auth.uid());

-- One-time bootstrap: any signed-in user may claim admin IFF no admin exists yet
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_exists boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be signed in';
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO admin_exists;
  IF admin_exists THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- Admin RPC: grant/revoke role for any user
CREATE OR REPLACE FUNCTION public.admin_set_role(_user_id uuid, _role app_role, _grant boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _grant THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Prevent self-demotion from admin
    IF _role = 'admin' AND _user_id = auth.uid() THEN
      RAISE EXCEPTION 'Cannot revoke your own admin role';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, app_role, boolean) TO authenticated;

-- Admin view of users with profile + roles
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz,
  roles app_role[],
  booking_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    p.full_name,
    p.avatar_url,
    u.created_at,
    COALESCE(ARRAY_AGG(DISTINCT r.role) FILTER (WHERE r.role IS NOT NULL), ARRAY[]::app_role[]),
    COUNT(DISTINCT b.id)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  LEFT JOIN public.bookings b ON b.user_id = u.id
  GROUP BY u.id, u.email, p.full_name, p.avatar_url, u.created_at
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
