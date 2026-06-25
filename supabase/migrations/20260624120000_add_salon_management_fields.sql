-- Add management fields to salons table
ALTER TABLE salons ADD COLUMN max_bookings_per_hour INT DEFAULT 1;
ALTER TABLE salons ADD COLUMN salon_holidays JSONB DEFAULT '[]'::jsonb;
ALTER TABLE salons ADD COLUMN operating_hours JSONB DEFAULT '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"open": "09:00", "close": "18:00"}}'::jsonb;
