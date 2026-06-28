-- Set all shop product prices to UGX 10,000.
-- Prices are stored in USD; the shop converts at 3,800 UGX per USD for display/checkout.
-- 10,000 / 3,800 keeps the displayed UGX price at exactly 10,000 at the default rate.

UPDATE public.products
SET
  regular_price_usd = 10000.0 / 3800.0,
  sale_price_usd = 0,
  price_usd = 10000.0 / 3800.0,
  updated_at = NOW();

-- Clear variant price modifiers so every variant matches the base price.
UPDATE public.product_variants
SET price_modifier = 0;
