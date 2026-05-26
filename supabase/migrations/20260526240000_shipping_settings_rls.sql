-- shipping_settings table + RLS (remote may have marked 20260502190000 applied without this table)

CREATE TABLE IF NOT EXISTS public.shipping_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate_usd NUMERIC(8, 2) NOT NULL CHECK (rate_usd >= 0),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  min_order_value_usd NUMERIC(8, 2) DEFAULT 0,
  max_order_value_usd NUMERIC(8, 2),
  estimated_days TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_settings_active ON public.shipping_settings(is_active);

INSERT INTO public.shipping_settings (name, rate_usd, description, is_active, countries, estimated_days)
SELECT * FROM (VALUES
  ('Standard Shipping - Uganda', 5.00::NUMERIC, 'Standard delivery within Uganda', TRUE, ARRAY['Uganda']::TEXT[], '3-5 days'),
  ('Express Shipping - Uganda', 12.00::NUMERIC, 'Express delivery within Uganda', TRUE, ARRAY['Uganda']::TEXT[], '1-2 days'),
  ('International Standard', 15.00::NUMERIC, 'Standard international shipping', TRUE, ARRAY[]::TEXT[], '7-14 days'),
  ('International Express', 35.00::NUMERIC, 'Express international shipping', TRUE, ARRAY[]::TEXT[], '3-7 days')
) AS v(name, rate_usd, description, is_active, countries, estimated_days)
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_settings LIMIT 1);

ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shipping settings are viewable by all" ON public.shipping_settings;
CREATE POLICY "Shipping settings are viewable by all"
  ON public.shipping_settings FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Only admins can manage shipping settings" ON public.shipping_settings;
CREATE POLICY "Only admins can manage shipping settings"
  ON public.shipping_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS public.tax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_rate NUMERIC(5, 2) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 100),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  apply_to_shipping BOOLEAN NOT NULL DEFAULT FALSE,
  countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_settings_active ON public.tax_settings(is_active);

ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tax settings are viewable by all" ON public.tax_settings;
CREATE POLICY "Tax settings are viewable by all"
  ON public.tax_settings FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Only admins can manage tax settings" ON public.tax_settings;
CREATE POLICY "Only admins can manage tax settings"
  ON public.tax_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Default Uganda VAT if none configured
INSERT INTO public.tax_settings (name, tax_rate, description, is_active, apply_to_shipping, countries)
SELECT
  'Uganda VAT',
  18.00,
  'Standard VAT for Uganda',
  TRUE,
  FALSE,
  ARRAY['Uganda']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM public.tax_settings LIMIT 1);
