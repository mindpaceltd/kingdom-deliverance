-- AI Digital Ministry Platform — core schema
-- Integrates with existing profiles, media, sermons, posts.

-- Platforms we can connect (official APIs preferred)
CREATE TABLE IF NOT EXISTS public.dm_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN (
    'facebook', 'instagram', 'youtube', 'tiktok', 'linkedin',
    'x', 'threads', 'pinterest', 'whatsapp', 'telegram',
    'rss', 'website', 'email', 'google_business'
  )),
  account_name TEXT,
  account_id TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected'
    CHECK (status IN ('connected', 'disconnected', 'expired', 'error', 'limited')),
  scopes TEXT[] DEFAULT '{}',
  token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  health_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (health_status IN ('healthy', 'degraded', 'error', 'unknown')),
  health_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  connected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (platform, account_id)
);

CREATE INDEX IF NOT EXISTS dm_social_accounts_platform_idx
  ON public.dm_social_accounts (platform) WHERE deleted_at IS NULL;

-- Unified content posts (create once, publish many)
CREATE TABLE IF NOT EXISTS public.dm_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  body TEXT,
  body_markdown TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'archived')),
  platforms TEXT[] NOT NULL DEFAULT '{}',
  media_ids UUID[] DEFAULT '{}',
  campaign_id UUID,
  sermon_id UUID REFERENCES public.sermons(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  ai_tone TEXT,
  ai_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS dm_posts_status_scheduled_idx
  ON public.dm_posts (status, scheduled_at) WHERE deleted_at IS NULL;

-- Per-platform publish attempts
CREATE TABLE IF NOT EXISTS public.dm_post_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dm_post_id UUID NOT NULL REFERENCES public.dm_posts(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES public.dm_social_accounts(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'queued', 'published', 'failed', 'manual_required')),
  external_id TEXT,
  external_url TEXT,
  error_message TEXT,
  published_at TIMESTAMPTZ,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_post_publications_post_idx
  ON public.dm_post_publications (dm_post_id);

-- Campaigns
CREATE TABLE IF NOT EXISTS public.dm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  start_date DATE,
  end_date DATE,
  goals JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.dm_posts
  DROP CONSTRAINT IF EXISTS dm_posts_campaign_id_fkey;
ALTER TABLE public.dm_posts
  ADD CONSTRAINT dm_posts_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES public.dm_campaigns(id) ON DELETE SET NULL;

-- AI generation log
CREATE TABLE IF NOT EXISTS public.dm_ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent TEXT NOT NULL,
  input_type TEXT,
  input_ref UUID,
  prompt TEXT,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  tokens_used INT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_ai_generations_created_idx
  ON public.dm_ai_generations (created_at DESC);

-- Competitors
CREATE TABLE IF NOT EXISTS public.dm_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  notes TEXT,
  platforms JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.dm_competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.dm_competitors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  followers BIGINT,
  subscribers BIGINT,
  views BIGINT,
  engagement_rate NUMERIC(8,4),
  posting_frequency NUMERIC(8,2),
  top_content JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_competitor_snapshots_comp_idx
  ON public.dm_competitor_snapshots (competitor_id, captured_at DESC);

-- Analytics snapshots (cached unified metrics)
CREATE TABLE IF NOT EXISTS public.dm_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'aggregated',
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (period, period_start, source)
);

-- Growth coach reports
CREATE TABLE IF NOT EXISTS public.dm_growth_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period TEXT NOT NULL DEFAULT 'daily'
    CHECK (period IN ('daily', 'weekly', 'monthly')),
  growth_score INT CHECK (growth_score BETWEEN 0 AND 100),
  summary TEXT,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_growth_pct NUMERIC(6,2),
  metrics_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_date, period)
);

-- Community comments inbox
CREATE TABLE IF NOT EXISTS public.dm_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  external_id TEXT,
  author_name TEXT,
  author_avatar TEXT,
  body TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'prayer', 'complaint', 'visitor', 'question', 'spam',
    'volunteer', 'donation', 'salvation', 'counselling', 'other'
  )),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'drafted', 'approved', 'replied', 'ignored')),
  ai_draft_reply TEXT,
  replied_at TIMESTAMPTZ,
  social_account_id UUID REFERENCES public.dm_social_accounts(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS dm_comments_status_idx
  ON public.dm_comments (status, created_at DESC) WHERE deleted_at IS NULL;

-- SEO audits
CREATE TABLE IF NOT EXISTS public.dm_seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_url TEXT NOT NULL,
  target_type TEXT,
  score INT,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.dm_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  href TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_notifications_user_idx
  ON public.dm_notifications (user_id, is_read, created_at DESC);

-- AI tasks / recommendations queue
CREATE TABLE IF NOT EXISTS public.dm_ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority INT NOT NULL DEFAULT 50 CHECK (priority BETWEEN 0 AND 100),
  expected_impact TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'done', 'dismissed')),
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Content calendar entries
CREATE TABLE IF NOT EXISTS public.dm_calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dm_post_id UUID REFERENCES public.dm_posts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.dm_campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  entry_date DATE NOT NULL,
  entry_time TIME,
  color TEXT DEFAULT '#4f46e5',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS dm_calendar_entries_date_idx
  ON public.dm_calendar_entries (entry_date) WHERE deleted_at IS NULL;

-- Generated reports
CREATE TABLE IF NOT EXISTS public.dm_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  export_urls JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE IF NOT EXISTS public.dm_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_audit_logs_created_idx
  ON public.dm_audit_logs (created_at DESC);

-- Sermon segments (clip detection / key moments)
CREATE TABLE IF NOT EXISTS public.dm_sermon_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id UUID NOT NULL REFERENCES public.sermons(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'powerful', 'prayer', 'funny', 'emotional', 'applause', 'reaction', 'quote', 'other'
  )),
  start_seconds NUMERIC(10,2),
  end_seconds NUMERIC(10,2),
  label TEXT,
  transcript_excerpt TEXT,
  confidence NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_sermon_segments_sermon_idx
  ON public.dm_sermon_segments (sermon_id);

-- Platform settings for the module
CREATE TABLE IF NOT EXISTS public.dm_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.dm_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_post_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_growth_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_calendar_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_sermon_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Staff can read/write most DM tables (admin, editor, author via is_content_manager)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_social_accounts' AND policyname = 'dm_social_accounts_staff'
  ) THEN
    CREATE POLICY dm_social_accounts_staff ON public.dm_social_accounts
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_posts' AND policyname = 'dm_posts_staff'
  ) THEN
    CREATE POLICY dm_posts_staff ON public.dm_posts
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_post_publications' AND policyname = 'dm_pub_staff'
  ) THEN
    CREATE POLICY dm_pub_staff ON public.dm_post_publications
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_campaigns' AND policyname = 'dm_campaigns_staff'
  ) THEN
    CREATE POLICY dm_campaigns_staff ON public.dm_campaigns
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_ai_generations' AND policyname = 'dm_ai_gen_staff'
  ) THEN
    CREATE POLICY dm_ai_gen_staff ON public.dm_ai_generations
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_competitors' AND policyname = 'dm_competitors_staff'
  ) THEN
    CREATE POLICY dm_competitors_staff ON public.dm_competitors
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_competitor_snapshots' AND policyname = 'dm_comp_snap_staff'
  ) THEN
    CREATE POLICY dm_comp_snap_staff ON public.dm_competitor_snapshots
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_analytics_snapshots' AND policyname = 'dm_analytics_staff'
  ) THEN
    CREATE POLICY dm_analytics_staff ON public.dm_analytics_snapshots
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_growth_reports' AND policyname = 'dm_growth_staff'
  ) THEN
    CREATE POLICY dm_growth_staff ON public.dm_growth_reports
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_comments' AND policyname = 'dm_comments_staff'
  ) THEN
    CREATE POLICY dm_comments_staff ON public.dm_comments
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_seo_audits' AND policyname = 'dm_seo_staff'
  ) THEN
    CREATE POLICY dm_seo_staff ON public.dm_seo_audits
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_notifications' AND policyname = 'dm_notif_own'
  ) THEN
    CREATE POLICY dm_notif_own ON public.dm_notifications
      FOR ALL USING (auth.uid() = user_id OR public.is_admin())
      WITH CHECK (auth.uid() = user_id OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_ai_tasks' AND policyname = 'dm_tasks_staff'
  ) THEN
    CREATE POLICY dm_tasks_staff ON public.dm_ai_tasks
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_calendar_entries' AND policyname = 'dm_cal_staff'
  ) THEN
    CREATE POLICY dm_cal_staff ON public.dm_calendar_entries
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_reports' AND policyname = 'dm_reports_staff'
  ) THEN
    CREATE POLICY dm_reports_staff ON public.dm_reports
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_audit_logs' AND policyname = 'dm_audit_admin'
  ) THEN
    CREATE POLICY dm_audit_admin ON public.dm_audit_logs
      FOR SELECT USING (public.is_admin());
    CREATE POLICY dm_audit_insert_staff ON public.dm_audit_logs
      FOR INSERT WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_sermon_segments' AND policyname = 'dm_segments_staff'
  ) THEN
    CREATE POLICY dm_segments_staff ON public.dm_sermon_segments
      FOR ALL USING (public.is_content_manager())
      WITH CHECK (public.is_content_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_settings' AND policyname = 'dm_settings_admin'
  ) THEN
    CREATE POLICY dm_settings_admin ON public.dm_settings
      FOR ALL USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;
