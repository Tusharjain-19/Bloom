
DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;
CREATE POLICY "Public can submit valid bookings" ON public.bookings
  FOR INSERT
  WITH CHECK (
    length(trim(customer_name)) BETWEEN 2 AND 80
    AND length(trim(customer_phone)) BETWEEN 7 AND 20
    AND length(trim(service_name)) BETWEEN 1 AND 120
    AND booking_date >= CURRENT_DATE
    AND status = 'pending'
  );
