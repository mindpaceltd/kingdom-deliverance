-- Create organization-images storage bucket via SQL
-- This creates the bucket and sets up public access policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-images',
  'organization-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for organization-images bucket
CREATE POLICY "Anyone can view organization images" ON storage.objects
FOR SELECT USING (bucket_id = 'organization-images');

CREATE POLICY "Anyone can upload organization images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'organization-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can update their own organization images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'organization-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can delete their own organization images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'organization-images' AND
  auth.role() = 'authenticated'
);
