-- ============================================================
-- E-commerce Flow Migration: Guest checkout, downloads, orders
-- ============================================================

-- Add fields to orders table for guest/customer info
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number SERIAL;

-- Download tokens table for secure digital product delivery
CREATE TABLE IF NOT EXISTS download_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  download_count INT DEFAULT 0,
  max_downloads INT DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_email ON download_tokens(email);
CREATE INDEX IF NOT EXISTS idx_download_tokens_order ON download_tokens(order_id);

-- RLS policies for download_tokens
ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view their own tokens by email match
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own download tokens') THEN
    CREATE POLICY "Users can view own download tokens"
      ON download_tokens FOR SELECT
      USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
  END IF;
END $$;

-- Service role has full access (handled by default when using service_role key)

-- Orders RLS: allow users to see their own orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own orders') THEN
    CREATE POLICY "Users can view own orders"
      ON orders FOR SELECT
      USING (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));
  END IF;
END $$;

-- Create a private bucket for product files (if not exists)
-- NOTE: This must be done via Supabase dashboard or Storage API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-files', 'product-files', false)
-- ON CONFLICT DO NOTHING;
