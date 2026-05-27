-- Repair: payment_gateways / email_templates were missing on some deployments
-- (migration 20260502190000 marked applied but tables not created).

CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name TEXT NOT NULL UNIQUE CHECK (gateway_name IN ('pesapal', 'paypal')),
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  icon_url TEXT,
  configuration JSONB DEFAULT '{}'::JSONB,
  test_mode BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_gateways_active ON public.payment_gateways(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_gateways_name ON public.payment_gateways(gateway_name);

INSERT INTO public.payment_gateways (gateway_name, display_name, description, is_active, display_order)
VALUES
  ('pesapal', 'Mobile Money (Pesapal)', 'Pay with mobile money or card via Pesapal', FALSE, 1),
  ('paypal', 'Pay with PayPal', 'PayPal account or card', FALSE, 2)
ON CONFLICT (gateway_name) DO NOTHING;

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payment gateways are viewable by all" ON public.payment_gateways;
CREATE POLICY "Payment gateways are viewable by all"
  ON public.payment_gateways FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Only admins can manage payment gateways" ON public.payment_gateways;
CREATE POLICY "Only admins can manage payment gateways"
  ON public.payment_gateways FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
