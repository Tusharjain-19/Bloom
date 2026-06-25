
DROP POLICY IF EXISTS "Owners can update their salons" ON public.salons;
CREATE POLICY "Owners can update or claim salons"
  ON public.salons FOR UPDATE TO authenticated
  USING (owner_id IS NULL OR owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
