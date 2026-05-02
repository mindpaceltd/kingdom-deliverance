-- ============================================================
-- Kingdom Deliverance Centre Uganda — Full Database Schema
-- Run this in Supabase SQL Editor (self-hosted)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'author', 'member')),
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- SITE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'Kingdom Deliverance Centre Uganda'),
  ('tagline', 'A Branch of Kingdom Temple — Led by Bishop Climate Wiseman'),
  ('contact_email', 'info@kdcuganda.org'),
  ('contact_phone', '+256 700 000000'),
  ('address', 'Kampala, Uganda'),
  ('facebook_url', ''),
  ('youtube_url', ''),
  ('twitter_url', ''),
  ('instagram_url', ''),
  ('service_times', 'Sunday: 9:00 AM & 11:30 AM | Wednesday: 6:30 PM'),
  ('live_stream_url', ''),
  ('donation_instructions', '')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- POSTS (blog + news)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'blog' CHECK (type IN ('blog', 'news')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_slug_idx ON public.posts(slug);
CREATE INDEX IF NOT EXISTS posts_status_idx ON public.posts(status);
CREATE INDEX IF NOT EXISTS posts_type_idx ON public.posts(type);

-- ============================================================
-- SERMONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sermons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT,
  video_url TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  preacher TEXT NOT NULL DEFAULT 'Bishop Climate Wiseman',
  series TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sermons_slug_idx ON public.sermons(slug);
CREATE INDEX IF NOT EXISTS sermons_date_idx ON public.sermons(date DESC);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT,
  date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  image_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  registration_url TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'past', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_date_idx ON public.events(date);

-- ============================================================
-- MINISTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ministries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT,
  leader TEXT,
  meeting_time TEXT,
  image_url TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEDIA LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document')),
  mime_type TEXT,
  size_bytes BIGINT,
  alt_text TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bucket TEXT DEFAULT 'media',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CMS PAGES (JSON section editor)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_json JSONB NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pages_slug_idx ON public.pages(slug);

-- ============================================================
-- GALLERY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  album TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DONATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_name TEXT,
  donor_email TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  method TEXT CHECK (method IN ('mobile_money', 'bank_transfer', 'cash', 'online', 'other')),
  reference TEXT,
  notes TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DONATION TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.donation_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL CHECK (gateway IN ('pesapal', 'paypal')),
  reference TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donation_transactions_donation ON public.donation_transactions(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_gateway ON public.donation_transactions(gateway);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_reference ON public.donation_transactions(reference);

-- ============================================================
-- PRAYER REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT,
  request TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTACT SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: check if current user is admin, editor, or author (content roles)
CREATE OR REPLACE FUNCTION public.is_content_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor', 'author')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: check if current user can manage structural CMS resources
CREATE OR REPLACE FUNCTION public.is_structure_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin());

-- SITE SETTINGS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site settings are public" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "Only admins can modify settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- POSTS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts are public" ON public.posts FOR SELECT USING (status = 'published' OR public.is_content_manager() OR author_id = auth.uid());
CREATE POLICY "Content managers can insert posts" ON public.posts FOR INSERT WITH CHECK (public.is_content_manager());
CREATE POLICY "Authors can update own posts" ON public.posts FOR UPDATE USING (author_id = auth.uid() OR public.is_content_manager());
CREATE POLICY "Content managers can delete posts" ON public.posts FOR DELETE USING (public.is_content_manager());

-- SERMONS
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published sermons are public" ON public.sermons FOR SELECT USING (status = 'published' OR public.is_content_manager());
CREATE POLICY "Content managers can manage sermons" ON public.sermons FOR ALL USING (public.is_content_manager());

-- EVENTS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are public" ON public.events FOR SELECT USING (TRUE);
CREATE POLICY "Content managers can manage events" ON public.events FOR ALL USING (public.is_content_manager());

-- MINISTRIES
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ministries are public" ON public.ministries FOR SELECT USING (is_active = TRUE OR public.is_structure_manager());
CREATE POLICY "Structure managers can manage ministries" ON public.ministries FOR ALL USING (public.is_structure_manager());

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Media is public" ON public.media FOR SELECT USING (TRUE);
CREATE POLICY "Content managers can upload media metadata" ON public.media FOR INSERT WITH CHECK (public.is_content_manager());
CREATE POLICY "Content managers can update media metadata" ON public.media FOR UPDATE USING (public.is_content_manager());
CREATE POLICY "Structure managers can delete media" ON public.media FOR DELETE USING (public.is_structure_manager());

-- Supabase Storage policies for media bucket
CREATE POLICY "Public read media objects"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Content managers can upload media objects"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated' AND public.is_content_manager());

CREATE POLICY "Content managers can update media objects"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media' AND public.is_content_manager());

CREATE POLICY "Structure managers can delete media objects"
ON storage.objects FOR DELETE
USING (bucket_id = 'media' AND public.is_structure_manager());

-- GALLERY
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gallery is public" ON public.gallery FOR SELECT USING (TRUE);
CREATE POLICY "Content managers can manage gallery" ON public.gallery FOR ALL USING (public.is_content_manager());

-- PAGES
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published pages are public" ON public.pages FOR SELECT USING (status = 'published' OR public.is_structure_manager());
CREATE POLICY "Structure managers can manage pages" ON public.pages FOR ALL USING (public.is_structure_manager());

-- DONATIONS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view donations" ON public.donations FOR SELECT USING (public.is_admin());
CREATE POLICY "Anyone can submit donation" ON public.donations FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can update donations" ON public.donations FOR UPDATE USING (public.is_admin());

-- DONATION TRANSACTIONS
ALTER TABLE public.donation_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view donation transactions" ON public.donation_transactions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update donation transactions" ON public.donation_transactions FOR UPDATE USING (public.is_admin());

-- PRAYER REQUESTS
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit prayer request" ON public.prayer_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Only content managers can view prayer requests" ON public.prayer_requests FOR SELECT USING (public.is_content_manager());

-- CONTACT SUBMISSIONS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Only content managers can view submissions" ON public.contact_submissions FOR SELECT USING (public.is_content_manager());

-- ============================================================
-- SEED DATA
-- ============================================================

-- Ministries
INSERT INTO public.ministries (name, slug, description, leader, meeting_time, icon, display_order) VALUES
  ('Worship & Arts', 'worship-arts', 'Leading the congregation into the presence of God through anointed worship, music, and creative arts.', 'Minister Sarah Nalule', 'Saturday 4:00 PM', 'Music', 1),
  ('Youth Ministry', 'youth-ministry', 'Empowering the next generation to walk boldly in faith, identity, and purpose.', 'Pastor James Okello', 'Friday 5:00 PM', 'Users', 2),
  ('Women''s Fellowship', 'womens-fellowship', 'A community of women growing together in faith, prayer, and sisterhood.', 'Mama Grace Achieng', 'Tuesday 10:00 AM', 'Heart', 3),
  ('Men''s Fellowship', 'mens-fellowship', 'Raising men of God who are pillars in their families, church, and community.', 'Elder David Kiggundu', 'Saturday 8:00 AM', 'Shield', 4),
  ('Children''s Church', 'childrens-church', 'Nurturing children in the Word of God with fun, creativity, and love.', 'Sister Ruth Nambi', 'Sunday 9:00 AM', 'Star', 5),
  ('Evangelism & Outreach', 'evangelism-outreach', 'Taking the Gospel beyond the walls of our church into the streets and communities.', 'Deacon Peter Musoke', 'Every Saturday 2:00 PM', 'Globe', 6),
  ('Prayer Ministry', 'prayer-ministry', 'Interceding for our church, nation, and the world through fervent, faith-filled prayer.', 'Elder Mary Atim', 'Daily 5:00 AM', 'BookOpen', 7),
  ('Deliverance Ministry', 'deliverance-ministry', 'Setting the captives free through the power of the Holy Spirit and the Word of God.', 'Bishop Climate Wiseman', 'Sunday After Service', 'Zap', 8)
ON CONFLICT (slug) DO NOTHING;

-- Sample Sermons
INSERT INTO public.sermons (title, slug, description, preacher, date, video_url, series, status) VALUES
  ('The Power of Faith in Troubled Times', 'power-of-faith-troubled-times', 'In this powerful message, Bishop Climate Wiseman explores how standing firm in faith can break chains and bring deliverance in our darkest moments.', 'Bishop Climate Wiseman', CURRENT_DATE - INTERVAL '7 days', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Faith Series', 'published'),
  ('Walking in Your Kingdom Authority', 'walking-kingdom-authority', 'Discover the biblical keys to exercising your God-given authority and dominion in every area of life.', 'Bishop Climate Wiseman', CURRENT_DATE - INTERVAL '14 days', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Kingdom Authority', 'published'),
  ('Deliverance from Generational Curses', 'deliverance-generational-curses', 'A deep teaching on identifying and breaking generational patterns through the blood of Jesus Christ.', 'Bishop Climate Wiseman', CURRENT_DATE - INTERVAL '21 days', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Deliverance Series', 'published')
ON CONFLICT (slug) DO NOTHING;

-- Sample Events
INSERT INTO public.events (title, slug, description, date, end_date, location, is_featured, status) VALUES
  ('Annual Deliverance Convention 2026', 'deliverance-convention-2026', 'Join us for three powerful nights of worship, prophetic ministry, and deliverance. Bishop Climate Wiseman will be ministering alongside special guests from across Africa.', NOW() + INTERVAL '14 days', NOW() + INTERVAL '17 days', 'Kingdom Deliverance Centre, Kampala', TRUE, 'upcoming'),
  ('Sunday School Graduation', 'sunday-school-graduation-2026', 'Celebrating our Sunday school children as they complete another year of growing in the Word of God.', NOW() + INTERVAL '7 days', NULL, 'Main Sanctuary', FALSE, 'upcoming'),
  ('Women''s Conference 2026', 'womens-conference-2026', 'A powerful one-day conference for women of God to be refreshed, equipped, and empowered for the next season.', NOW() + INTERVAL '30 days', NULL, 'Kingdom Deliverance Centre, Kampala', TRUE, 'upcoming'),
  ('Community Outreach — Namuwongo', 'community-outreach-namuwongo', 'Join us as we take the love of Christ to the streets — food distribution, medical camp, and Gospel outreach.', NOW() + INTERVAL '21 days', NULL, 'Namuwongo Slum, Kampala', FALSE, 'upcoming')
ON CONFLICT (slug) DO NOTHING;
