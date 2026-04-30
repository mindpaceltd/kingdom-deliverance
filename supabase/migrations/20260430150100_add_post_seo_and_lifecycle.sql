-- ============================================================
-- UPGRADE POSTS TABLE
-- ============================================================

-- Add new columns for SEO and lifecycle management to maintain parity with sermons
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update status constraint
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check 
  CHECK (status IN ('draft', 'published', 'scheduled', 'trash', 'archived'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS posts_scheduled_at_idx ON public.posts(scheduled_at);
CREATE INDEX IF NOT EXISTS posts_deleted_at_idx ON public.posts(deleted_at);

-- ============================================================
-- RPC FOR ATOMIC VIEW INCREMENT (POSTS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_post_views(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts
  SET views = views + 1
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
