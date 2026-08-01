-- Competitor Intelligence Engine — extended data model

ALTER TABLE public.dm_competitors
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS organization_type TEXT
    CHECK (organization_type IS NULL OR organization_type IN (
      'church', 'ministry', 'christian_org', 'pastor', 'media_ministry', 'ngo', 'other'
    )),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS monitoring_frequency TEXT NOT NULL DEFAULT 'manual'
    CHECK (monitoring_frequency IN ('daily', 'weekly', 'manual')),
  ADD COLUMN IF NOT EXISTS last_captured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS latest_capture_run_id UUID;

CREATE TABLE IF NOT EXISTS public.dm_competitor_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.dm_competitors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  profile_url TEXT,
  feed_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'profile'
    CHECK (source_type IN ('profile', 'feed', 'website', 'api')),
  discovery_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (discovery_status IN ('pending', 'connected', 'limited', 'unavailable', 'error')),
  last_checked_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_competitor_sources_comp_idx
  ON public.dm_competitor_sources (competitor_id, platform);

CREATE TABLE IF NOT EXISTS public.dm_competitor_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.dm_competitors(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.dm_competitor_sources(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  external_id TEXT,
  url TEXT,
  title TEXT,
  caption TEXT,
  description TEXT,
  content_type TEXT,
  published_at TIMESTAMPTZ,
  likes BIGINT,
  comments BIGINT,
  shares BIGINT,
  views BIGINT,
  hashtags TEXT[] DEFAULT '{}',
  topic TEXT,
  subtopic TEXT,
  cta TEXT,
  media_type TEXT,
  sentiment TEXT,
  raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_competitor_content_comp_idx
  ON public.dm_competitor_content (competitor_id, published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS dm_competitor_content_topic_idx
  ON public.dm_competitor_content (competitor_id, topic);

CREATE UNIQUE INDEX IF NOT EXISTS dm_competitor_content_dedupe_idx
  ON public.dm_competitor_content (competitor_id, platform, COALESCE(external_id, url));

CREATE TABLE IF NOT EXISTS public.dm_competitor_capture_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.dm_competitors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_count INT NOT NULL DEFAULT 0,
  video_count INT NOT NULL DEFAULT 0,
  website_posts INT NOT NULL DEFAULT 0,
  topic_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  activity_score NUMERIC(8,2),
  ai_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS dm_competitor_capture_runs_comp_idx
  ON public.dm_competitor_capture_runs (competitor_id, started_at DESC);

ALTER TABLE public.dm_competitors
  DROP CONSTRAINT IF EXISTS dm_competitors_latest_capture_run_id_fkey;

ALTER TABLE public.dm_competitors
  ADD CONSTRAINT dm_competitors_latest_capture_run_id_fkey
  FOREIGN KEY (latest_capture_run_id) REFERENCES public.dm_competitor_capture_runs(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.dm_competitor_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.dm_competitors(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IS NULL OR priority IN ('high', 'medium', 'low', 'emerging')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_competitor_insights_comp_idx
  ON public.dm_competitor_insights (competitor_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS public.dm_competitor_strategy_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.dm_competitor_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_competitor_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_competitor_capture_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_competitor_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_competitor_strategy_reports ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'dm_competitor_sources',
    'dm_competitor_content',
    'dm_competitor_capture_runs',
    'dm_competitor_insights',
    'dm_competitor_strategy_reports'
  ]
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I;',
      t || '_staff',
      t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());',
      t || '_staff',
      t
    );
  END LOOP;
END $$;
