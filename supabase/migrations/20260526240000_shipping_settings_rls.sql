-- RLS for shipping_settings (matches tax_settings / payment_gateways pattern)

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
