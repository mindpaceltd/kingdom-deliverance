-- 1. Testimonies Table
CREATE TABLE IF NOT EXISTS testimonies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  testimony TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE testimonies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'testimonies' AND policyname = 'Anyone can submit testimony') THEN
    CREATE POLICY "Anyone can submit testimony" ON testimonies FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'testimonies' AND policyname = 'Anyone can view approved testimonies') THEN
    CREATE POLICY "Anyone can view approved testimonies" ON testimonies FOR SELECT USING (status = 'approved');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'testimonies' AND policyname = 'Admins can manage all testimonies') THEN
    CREATE POLICY "Admins can manage all testimonies" ON testimonies FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- 2. Google Integration Tables
CREATE TABLE IF NOT EXISTS users_google_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
ALTER TABLE users_google_integrations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users_google_integrations' AND policyname = 'Users manage own google integration') THEN
    CREATE POLICY "Users manage own google integration" ON users_google_integrations FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS analytics_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT,
  property_id TEXT,
  stream_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
ALTER TABLE analytics_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_config' AND policyname = 'Users manage own analytics config') THEN
    CREATE POLICY "Users manage own analytics config" ON analytics_config FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS search_console_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  site_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
ALTER TABLE search_console_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_console_config' AND policyname = 'Users manage own sc config') THEN
    CREATE POLICY "Users manage own sc config" ON search_console_config FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Update Site Settings
INSERT INTO site_settings (key, value) 
VALUES ('site_og_image', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_settings (key, value) 
VALUES ('ga_measurement_id', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_settings (key, value) 
VALUES ('sc_property_url', '')
ON CONFLICT (key) DO NOTHING;
