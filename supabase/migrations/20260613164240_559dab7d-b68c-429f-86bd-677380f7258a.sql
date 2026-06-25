
DROP POLICY IF EXISTS "Anyone can view bookings (demo)" ON public.bookings;
REVOKE SELECT ON public.bookings FROM anon, authenticated;
