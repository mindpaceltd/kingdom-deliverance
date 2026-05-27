-- Product SEO score + page views (admin list + analytics)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_product_views(p_product_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.products
  SET views = COALESCE(views, 0) + 1
  WHERE id = p_product_id;
$$;
