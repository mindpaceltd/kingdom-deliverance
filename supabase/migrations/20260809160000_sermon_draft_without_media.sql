-- Sermons without media must not default to published.
-- Manuscript / email imports often have content but no video_url.

ALTER TABLE public.sermons
  ALTER COLUMN status SET DEFAULT 'draft';

-- Demote live sermons that have neither video nor audio (keep trash/archived alone).
UPDATE public.sermons
SET
  status = 'draft',
  published_at = NULL,
  scheduled_at = NULL,
  updated_at = NOW()
WHERE status IN ('published', 'scheduled')
  AND deleted_at IS NULL
  AND (video_url IS NULL OR btrim(video_url) = '')
  AND (audio_url IS NULL OR btrim(audio_url) = '');
