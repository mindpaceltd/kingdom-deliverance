-- ============================================================
-- SERMON SERIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sermon_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sermon_series_slug_idx ON public.sermon_series(slug);

-- RLS for sermon_series
ALTER TABLE public.sermon_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sermon series are public" ON public.sermon_series FOR SELECT USING (TRUE);
CREATE POLICY "Only structure managers can manage sermon series" ON public.sermon_series FOR ALL USING (public.is_structure_manager());

-- ============================================================
-- UPGRADE SERMONS TABLE
-- ============================================================

-- Add new columns
ALTER TABLE public.sermons 
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.sermon_series(id) ON DELETE SET NULL;

-- Update status constraint to match posts
ALTER TABLE public.sermons DROP CONSTRAINT IF EXISTS sermons_status_check;
ALTER TABLE public.sermons ADD CONSTRAINT sermons_status_check 
  CHECK (status IN ('draft', 'published', 'scheduled', 'trash', 'archived'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS sermons_status_idx ON public.sermons(status);
CREATE INDEX IF NOT EXISTS sermons_series_id_idx ON public.sermons(series_id);

-- ============================================================
-- RPC FOR ATOMIC VIEW INCREMENT
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_sermon_views(p_sermon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.sermons
  SET views = views + 1
  WHERE id = p_sermon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
