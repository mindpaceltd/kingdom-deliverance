-- Upgrade Products table to WooCommerce-style
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS regular_price_usd DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_price_usd DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS image_alt TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'instock', -- instock, outofstock, onbackorder
ADD COLUMN IF NOT EXISTS download_limit INTEGER DEFAULT -1, -- -1 for unlimited
ADD COLUMN IF NOT EXISTS download_expiry_days INTEGER DEFAULT -1; -- -1 for never

-- Create Product Images gallery table
CREATE TABLE IF NOT EXISTS public.product_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for gallery
ALTER TABLE public.product_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_gallery" ON public.product_gallery FOR SELECT USING (true);
CREATE POLICY "Admin write product_gallery" ON public.product_gallery FOR ALL USING (auth.jwt() ->> 'email' = 'admin@kdcuganda.org');
