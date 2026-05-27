-- Credit pricing & welcome bonus (managed in Admin → Credits)
INSERT INTO public.site_settings (key, value)
VALUES
  ('credit_price_gbp', '1'),
  ('credit_new_user_bonus', '0'),
  ('credit_checkout_currency', 'UGX')
ON CONFLICT (key) DO NOTHING;
