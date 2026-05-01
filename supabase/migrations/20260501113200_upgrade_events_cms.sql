-- ============================================================
-- UPGRADE EVENTS TABLE
-- ============================================================

-- Add SEO and lifecycle columns to events to maintain parity with posts and sermons
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update status constraint to include CMS lifecycle states while keeping event specific ones
-- Note: 'trash' and 'archived' are used for CMS lifecycle. 
-- 'upcoming', 'ongoing', 'past', 'cancelled' are event lifecycle.
-- We will merge them into a single status field for simplicity in the CMS UI.
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check 
  CHECK (status IN ('draft', 'published', 'scheduled', 'trash', 'archived', 'upcoming', 'ongoing', 'past', 'cancelled'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS events_scheduled_at_idx ON public.events(scheduled_at);
CREATE INDEX IF NOT EXISTS events_deleted_at_idx ON public.events(deleted_at);

-- ============================================================
-- RPC FOR ATOMIC VIEW INCREMENT (EVENTS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_event_views(p_event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.events
  SET views = views + 1
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
