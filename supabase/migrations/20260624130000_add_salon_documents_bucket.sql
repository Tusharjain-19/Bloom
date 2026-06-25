-- 1. Add verification_document column to salons table
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS verification_document text;

-- 2. Create the salon-documents bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon-documents', 'salon-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Policies for salon-documents bucket
-- Allow authenticated users to upload their own documents
CREATE POLICY "Authenticated users can upload salon documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'salon-documents' AND
  (auth.uid()::text = split_part(name, '-', 1))
);

-- Allow HQ admins to view all documents
CREATE POLICY "Admins can view all salon documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'salon-documents' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own salon documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'salon-documents' AND
  (auth.uid()::text = split_part(name, '-', 1))
);
