
CREATE TABLE public.salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  description text NOT NULL,
  neighborhood text NOT NULL,
  address text NOT NULL,
  phone text,
  image_url text NOT NULL,
  rating numeric(2,1) NOT NULL DEFAULT 4.8,
  review_count integer NOT NULL DEFAULT 0,
  price_tier text NOT NULL DEFAULT '₹₹₹',
  specialties text[] NOT NULL DEFAULT '{}',
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  hours text NOT NULL DEFAULT '10:00 AM – 9:00 PM',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.salons TO anon, authenticated;
GRANT ALL ON public.salons TO service_role;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salons are public" ON public.salons FOR SELECT USING (true);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  service_price integer NOT NULL,
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.bookings TO anon, authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create a booking" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view bookings (demo)" ON public.bookings FOR SELECT USING (true);
