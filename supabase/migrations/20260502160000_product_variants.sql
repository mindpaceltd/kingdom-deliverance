-- Create Product Attributes table
CREATE TABLE IF NOT EXISTS public.product_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Product Attribute Values table
CREATE TABLE IF NOT EXISTS public.product_attribute_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attribute_id UUID REFERENCES public.product_attributes(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a junction table for Product -> Attribute Values
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    attribute_value_ids UUID[] NOT NULL, -- Array of value IDs (e.g. [Red_ID, XL_ID])
    price_modifier DECIMAL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read product_attributes" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "Admin write product_attributes" ON public.product_attributes FOR ALL USING (auth.jwt() ->> 'email' = 'admin@kdcuganda.org');

CREATE POLICY "Public read product_attribute_values" ON public.product_attribute_values FOR SELECT USING (true);
CREATE POLICY "Admin write product_attribute_values" ON public.product_attribute_values FOR ALL USING (auth.jwt() ->> 'email' = 'admin@kdcuganda.org');

CREATE POLICY "Public read product_variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admin write product_variants" ON public.product_variants FOR ALL USING (auth.jwt() ->> 'email' = 'admin@kdcuganda.org');
