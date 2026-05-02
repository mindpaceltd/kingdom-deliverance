-- ============================================================
-- Tax Settings, Payment Gateways, and Email Templates
-- ============================================================

-- Shipping Settings Table
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

-- Tax Settings Table
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

-- Payment Gateways Table
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

-- Email Templates Table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'order_confirmation',
    'order_shipped',
    'order_delivered',
    'order_cancelled',
    'refund_initiated',
    'refund_completed',
    'payment_received',
    'payment_failed',
    'download_ready',
    'customer_notification',
    'admin_notification'
  )),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(template_type);

-- Insert default payment gateways
INSERT INTO public.payment_gateways (gateway_name, display_name, description, is_active, display_order)
VALUES
  ('pesapal', 'Mobile Money Payment', 'Pay with mobile money or card', FALSE, 1),
  ('paypal', 'Pay with PayPal', 'PayPal account or card', FALSE, 2)
ON CONFLICT (gateway_name) DO NOTHING;

-- Insert default shipping rates
INSERT INTO public.shipping_settings (name, rate_usd, description, is_active, countries, estimated_days)
VALUES
  ('Standard Shipping - Uganda', 5.00, 'Standard delivery within Uganda', TRUE, ARRAY['Uganda'], '3-5 days'),
  ('Express Shipping - Uganda', 12.00, 'Express delivery within Uganda', TRUE, ARRAY['Uganda'], '1-2 days'),
  ('International Standard', 15.00, 'Standard international shipping', TRUE, ARRAY[]::TEXT[], '7-14 days'),
  ('International Express', 35.00, 'Express international shipping', TRUE, ARRAY[]::TEXT[], '3-7 days')
ON CONFLICT DO NOTHING;

-- Insert default email templates
INSERT INTO public.email_templates (template_name, display_name, subject, html_content, text_content, template_type, variables)
VALUES
  (
    'order_confirmation',
    'Order Confirmation',
    'Order Confirmed - {{order_number}}',
    '<h2>Order Confirmed!</h2><p>Hi {{customer_name}},</p><p>Thank you for your purchase. Your order #{{order_number}} has been received.</p><p><strong>Total: {{currency}} {{total_amount}}</strong></p><p>View your order: {{order_link}}</p>',
    'Order Confirmed!\n\nHi {{customer_name}},\n\nThank you for your purchase. Your order #{{order_number}} has been received.\n\nTotal: {{currency}} {{total_amount}}\n\nView your order: {{order_link}}',
    'order_confirmation',
    ARRAY['customer_name', 'order_number', 'total_amount', 'currency', 'order_link']
  ),
  (
    'order_shipped',
    'Order Shipped',
    'Your Order Has Shipped - {{order_number}}',
    '<h2>Your Order Has Shipped!</h2><p>Hi {{customer_name}},</p><p>Great news! Your order #{{order_number}} has been shipped.</p><p>Tracking: {{tracking_number}}</p>',
    'Your Order Has Shipped!\n\nHi {{customer_name}},\n\nGreat news! Your order #{{order_number}} has been shipped.\n\nTracking: {{tracking_number}}',
    'order_shipped',
    ARRAY['customer_name', 'order_number', 'tracking_number']
  ),
  (
    'refund_initiated',
    'Refund Initiated',
    'Refund Initiated - {{order_number}}',
    '<h2>Refund Initiated</h2><p>Hi {{customer_name}},</p><p>We have initiated a refund for order #{{order_number}}.</p><p>Refund Amount: {{currency}} {{refund_amount}}</p><p>Expected in 5-7 business days.</p>',
    'Refund Initiated\n\nHi {{customer_name}},\n\nWe have initiated a refund for order #{{order_number}}.\n\nRefund Amount: {{currency}} {{refund_amount}}\n\nExpected in 5-7 business days.',
    'refund_initiated',
    ARRAY['customer_name', 'order_number', 'refund_amount', 'currency']
  ),
  (
    'download_ready',
    'Download Ready',
    'Your Digital Product is Ready - {{product_name}}',
    '<h2>Your Download is Ready!</h2><p>Hi {{customer_name}},</p><p>Your digital product {{product_name}} is ready to download.</p><p>Download Link: {{download_link}}</p><p>Valid for {{days_valid}} days, {{max_downloads}} downloads.</p>',
    'Your Download is Ready!\n\nHi {{customer_name}},\n\nYour digital product {{product_name}} is ready to download.\n\nDownload Link: {{download_link}}\n\nValid for {{days_valid}} days, {{max_downloads}} downloads.',
    'download_ready',
    ARRAY['customer_name', 'product_name', 'download_link', 'days_valid', 'max_downloads']
  )
ON CONFLICT (template_name) DO NOTHING;

-- Enable RLS for tax_settings
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tax settings are viewable by all" ON public.tax_settings FOR SELECT USING (TRUE);
CREATE POLICY "Only admins can manage tax settings" ON public.tax_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Enable RLS for payment_gateways
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payment gateways are viewable by all" ON public.payment_gateways FOR SELECT USING (TRUE);
CREATE POLICY "Only admins can manage payment gateways" ON public.payment_gateways FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Enable RLS for email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Email templates viewable by content managers" ON public.email_templates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);
CREATE POLICY "Only admins can manage email templates" ON public.email_templates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
