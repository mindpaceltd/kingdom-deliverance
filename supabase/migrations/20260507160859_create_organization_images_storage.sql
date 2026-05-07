-- ============================================================
-- ORGANIZATION IMAGES STORAGE AND SETTINGS
-- ============================================================

-- Add image fields to site_settings
ALTER TABLE public.site_settings 
  ADD COLUMN IF NOT EXISTS image_type TEXT DEFAULT 'url' CHECK (image_type IN ('url', 'upload')),
  ADD COLUMN IF NOT EXISTS image_bucket TEXT,
  ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Create organization_images table for managing multiple images
CREATE TABLE IF NOT EXISTS public.organization_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('logo', 'og_image', 'church_building', 'leadership', 'hero')),
  bucket TEXT NOT NULL DEFAULT 'organization-images',
  path TEXT NOT NULL,
  url TEXT,
  alt_text TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organization_images_type_idx ON public.organization_images(type);
CREATE INDEX IF NOT EXISTS organization_images_active_idx ON public.organization_images(is_active);

-- RLS for organization_images
ALTER TABLE public.organization_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organization images are public" ON public.organization_images FOR SELECT USING (is_active = true);
CREATE POLICY "Only structure managers can manage organization images" ON public.organization_images FOR ALL USING (public.is_structure_manager());

-- Insert default organization image settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_logo_type', 'upload'),
  ('site_og_image_type', 'upload'),
  ('church_building_image_type', 'upload'),
  ('organization_images_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Function to get active organization image URLs
CREATE OR REPLACE FUNCTION public.get_organization_image(p_type TEXT)
RETURNS TABLE (url TEXT, alt_text TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CONCAT('https://', bucket, '.supabase.co/storage/v1/object/public/', path) as url,
    alt_text
  FROM public.organization_images
  WHERE type = p_type 
    AND is_active = true 
  ORDER BY sort_order ASC, created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;