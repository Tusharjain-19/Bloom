-- Add booking_amount to salons table
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS booking_amount numeric DEFAULT 0;

-- Add payment fields to bookings table for Razorpay tracking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS order_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS advance_paid numeric DEFAULT 0;
