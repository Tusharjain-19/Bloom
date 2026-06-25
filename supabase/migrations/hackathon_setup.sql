-- ============================================================================
-- HACKATHON SETUP SCRIPT: JUDGE DEMO MODE & MOCK DATA
-- ============================================================================
-- Run this script in the Supabase SQL Editor to prepare your app for judging!

-- 1. Create the Judge User Account
-- This inserts a predefined user: judge@bloom.in / Hackathon123!
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'judge@bloom.in',
  crypt('Hackathon123!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Hackathon Judge"}',
  now(),
  now(),
  'authenticated'
)
ON CONFLICT (email) DO NOTHING;

-- 2. Give the Judge "Admin" role so they can access the HQ Dashboard
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'judge@bloom.in'
ON CONFLICT DO NOTHING;

-- 3. Assign the Judge as the Owner of ALL approved salons
-- This makes sure the Salon Admin dashboard shows all salons
UPDATE public.salons
SET owner_id = (SELECT id FROM auth.users WHERE email = 'judge@bloom.in')
WHERE status = 'approved';

