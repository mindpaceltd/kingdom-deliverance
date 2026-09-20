-- Publish/schedule readiness is featured image (thumbnail_url), not video/audio.
-- Demote live sermons that have no cover image.

UPDATE public.sermons
SET
  status = 'draft',
  published_at = NULL,
  scheduled_at = NULL,
  updated_at = NOW()
WHERE status IN ('published', 'scheduled')
  AND deleted_at IS NULL
  AND (thumbnail_url IS NULL OR btrim(thumbnail_url) = '');
