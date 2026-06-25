
-- 1. Extend salons table with verification + capacity fields
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS max_bookings_per_day integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.salons
  DROP CONSTRAINT IF EXISTS salons_status_check;
ALTER TABLE public.salons
  ADD CONSTRAINT salons_status_check CHECK (status IN ('pending','approved','rejected'));

CREATE INDEX IF NOT EXISTS salons_status_idx ON public.salons(status, published);

-- Updated_at trigger
DROP TRIGGER IF EXISTS salons_updated_at ON public.salons;
CREATE TRIGGER salons_updated_at BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Replace public SELECT policy → only approved+published rows visible to all;
--    owners see their own; admins via existing policy.
DROP POLICY IF EXISTS "Salons are public" ON public.salons;

CREATE POLICY "Public sees approved published salons"
  ON public.salons FOR SELECT
  USING (status = 'approved' AND published = true);

CREATE POLICY "Owners see their own salons"
  ON public.salons FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Allow authenticated users to submit a new salon (must be pending and own it)
CREATE POLICY "Authenticated users can submit salons"
  ON public.salons FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid() AND status = 'pending');

-- Tighten owner UPDATE: cannot self-approve, cannot publish while pending
DROP POLICY IF EXISTS "Owners can update or claim salons" ON public.salons;
CREATE POLICY "Owners update their salons"
  ON public.salons FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR owner_id IS NULL)
  WITH CHECK (
    owner_id = auth.uid()
    -- Owner cannot change verification state; trigger below enforces this
  );

-- Trigger preventing owners from self-approving or changing status
CREATE OR REPLACE FUNCTION public.salons_guard_owner_updates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  -- Non-admin owners cannot modify these fields
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only HQ admins can change salon status';
  END IF;
  IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'Only HQ admins can change rejection reason';
  END IF;
  IF NEW.featured IS DISTINCT FROM OLD.featured THEN
    RAISE EXCEPTION 'Only HQ admins can feature a salon';
  END IF;
  -- Cannot publish until approved
  IF NEW.published = true AND NEW.status <> 'approved' THEN
    RAISE EXCEPTION 'Salon must be approved before publishing';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS salons_guard_owner_updates ON public.salons;
CREATE TRIGGER salons_guard_owner_updates BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.salons_guard_owner_updates();

-- 3. Salon holidays
CREATE TABLE IF NOT EXISTS public.salon_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  holiday_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (salon_id, holiday_date)
);

GRANT SELECT ON public.salon_holidays TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.salon_holidays TO authenticated;
GRANT ALL ON public.salon_holidays TO service_role;

ALTER TABLE public.salon_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Holidays are public"
  ON public.salon_holidays FOR SELECT
  USING (true);

CREATE POLICY "Owners manage their holidays"
  ON public.salon_holidays FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Special requests
CREATE TABLE IF NOT EXISTS public.special_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  preferred_date date,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.special_requests TO authenticated;
GRANT INSERT ON public.special_requests TO anon;
GRANT ALL ON public.special_requests TO service_role;

ALTER TABLE public.special_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a special request"
  ON public.special_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners see their salon's requests"
  ON public.special_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR (user_id IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Owners update their salon's requests"
  ON public.special_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

DROP TRIGGER IF EXISTS special_requests_updated_at ON public.special_requests;
CREATE TRIGGER special_requests_updated_at BEFORE UPDATE ON public.special_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Booking guard: prevent booking on holiday or past daily cap
CREATE OR REPLACE FUNCTION public.bookings_capacity_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_holiday boolean;
  cap integer;
  used integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.salon_holidays
    WHERE salon_id = NEW.salon_id AND holiday_date = NEW.booking_date
  ) INTO is_holiday;
  IF is_holiday THEN
    RAISE EXCEPTION 'The salon is closed on this date.';
  END IF;

  SELECT max_bookings_per_day INTO cap FROM public.salons WHERE id = NEW.salon_id;
  IF cap IS NOT NULL THEN
    SELECT count(*) INTO used FROM public.bookings
    WHERE salon_id = NEW.salon_id
      AND booking_date = NEW.booking_date
      AND status <> 'cancelled';
    IF used >= cap THEN
      RAISE EXCEPTION 'No slots left for this date.';
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS bookings_capacity_guard ON public.bookings;
CREATE TRIGGER bookings_capacity_guard BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.bookings_capacity_guard();

-- 6. Admin approve/reject function
CREATE OR REPLACE FUNCTION public.admin_approve_salon(
  _salon_id uuid,
  _approve boolean,
  _reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT owner_id INTO v_owner FROM public.salons WHERE id = _salon_id;

  IF _approve THEN
    UPDATE public.salons
      SET status = 'approved',
          rejection_reason = NULL,
          approved_at = now()
      WHERE id = _salon_id;
    -- Auto-grant salon_owner role to the submitter
    IF v_owner IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_owner, 'salon_owner')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  ELSE
    UPDATE public.salons
      SET status = 'rejected',
          published = false,
          rejection_reason = COALESCE(_reason, 'Not specified')
      WHERE id = _salon_id;
  END IF;
END $$;

-- Backfill: existing seeded salons remain approved+published (defaults handled it)
UPDATE public.salons SET submitted_at = COALESCE(submitted_at, created_at), approved_at = COALESCE(approved_at, created_at) WHERE status = 'approved';
