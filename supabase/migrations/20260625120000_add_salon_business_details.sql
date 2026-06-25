-- Add business_details JSONB column to salons table to store GST, UPI, Legal Name etc.
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS business_details jsonb DEFAULT '{}'::jsonb;



