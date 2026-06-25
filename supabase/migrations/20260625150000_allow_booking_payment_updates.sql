-- 1. Create a public view for slot availability to bypass SELECT restriction securely
CREATE OR REPLACE VIEW public.booking_slots AS
  SELECT id, salon_id, booking_date, booking_time, status
  FROM public.bookings
  WHERE status != 'cancelled';

-- Grant select access on the view to public/anon and authenticated users
GRANT SELECT ON public.booking_slots TO anon, authenticated;

-- 2. Grant column-level select privilege on bookings table for updates and status checks
GRANT SELECT (id, salon_id, booking_date, booking_time, status) ON public.bookings TO anon, authenticated;

-- 3. Grant update privilege on bookings table to public/anon and authenticated users
GRANT UPDATE ON public.bookings TO anon, authenticated;

-- Drop the update policy if it exists
DROP POLICY IF EXISTS "Public can update pending_payment bookings" ON public.bookings;

-- Create the update policy to allow updating bookings that are pending payment
CREATE POLICY "Public can update pending_payment bookings" ON public.bookings
  FOR UPDATE TO anon, authenticated
  USING (status = 'pending_payment')
  WITH CHECK (status IN ('pending', 'pending_payment'));
