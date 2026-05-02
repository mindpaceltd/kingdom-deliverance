-- Fix RLS Policies for all E-commerce tables
-- Ensure admin@kdcuganda.org has full control

-- 1. Product Categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admin write product_categories" ON public.product_categories;

CREATE POLICY "Public read product_categories" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Admin full access product_categories" ON public.product_categories FOR ALL 
USING (auth.jwt() ->> 'email' = 'admin@kdcuganda.org')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@kdcuganda.org');

-- 2. Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Admin write products" ON public.products;

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin full access products" ON public.products FOR ALL 
USING (auth.jwt() ->> 'email' = 'admin@kdcuganda.org')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@kdcuganda.org');

-- 3. Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access orders" ON public.orders;

CREATE POLICY "Admin full access orders" ON public.orders FOR ALL 
USING (auth.jwt() ->> 'email' = 'admin@kdcuganda.org')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@kdcuganda.org');

-- 4. Attributes & Values (Ensure these are also covered)
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Admin write product_attributes" ON public.product_attributes;

CREATE POLICY "Public read product_attributes" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "Admin full access product_attributes" ON public.product_attributes FOR ALL 
USING (auth.jwt() ->> 'email' = 'admin@kdcuganda.org')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@kdcuganda.org');

ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_attribute_values" ON public.product_attribute_values;
DROP POLICY IF EXISTS "Admin write product_attribute_values" ON public.product_attribute_values;

CREATE POLICY "Public read product_attribute_values" ON public.product_attribute_values FOR SELECT USING (true);
CREATE POLICY "Admin full access product_attribute_values" ON public.product_attribute_values FOR ALL 
USING (auth.jwt() ->> 'email' = 'admin@kdcuganda.org')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@kdcuganda.org');
