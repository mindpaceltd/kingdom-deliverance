-- ============================================================
-- UPGRADE MINISTRIES TABLE
-- ============================================================

-- Add SEO and lifecycle columns to ministries
ALTER TABLE public.ministries 
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add check constraint for status
ALTER TABLE public.ministries DROP CONSTRAINT IF EXISTS ministries_status_check;
ALTER TABLE public.ministries ADD CONSTRAINT ministries_status_check 
  CHECK (status IN ('draft', 'published', 'scheduled', 'trash', 'archived'));

-- Indexes
CREATE INDEX IF NOT EXISTS ministries_deleted_at_idx ON public.ministries(deleted_at);

-- ============================================================
-- RPC FOR ATOMIC VIEW INCREMENT (MINISTRIES)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_ministry_views(p_ministry_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.ministries
  SET views = views + 1
  WHERE id = p_ministry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
