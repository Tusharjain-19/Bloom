-- Drop existing policies
DROP POLICY IF EXISTS "Public can submit valid bookings" ON public.bookings;
DROP POLICY IF EXISTS "Auth users can insert their own bookings" ON public.bookings;

-- Re-create Public policy supporting pending_payment status
CREATE POLICY "Public can submit valid bookings" ON public.bookings
  FOR INSERT
  WITH CHECK (
    length(trim(customer_name)) BETWEEN 2 AND 80
    AND length(trim(customer_phone)) BETWEEN 7 AND 20
    AND length(trim(service_name)) BETWEEN 1 AND 120
    AND booking_date >= CURRENT_DATE
    AND status IN ('pending', 'pending_payment')
  );

-- Re-create Authenticated policy supporting pending_payment status
CREATE POLICY "Auth users can insert their own bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND length(trim(customer_name)) BETWEEN 2 AND 80
    AND length(trim(customer_phone)) BETWEEN 7 AND 20
    AND length(trim(service_name)) BETWEEN 1 AND 120
    AND booking_date >= CURRENT_DATE
    AND status IN ('pending', 'pending_payment')
  );
