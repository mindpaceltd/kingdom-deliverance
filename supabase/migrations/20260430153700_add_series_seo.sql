-- ============================================================
-- UPGRADE SERMON_SERIES TABLE
-- ============================================================

-- Add SEO and lifecycle columns to sermon_series
ALTER TABLE public.sermon_series
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- Ensure slug is unique if not already
-- (It already is unique based on schema.sql)
