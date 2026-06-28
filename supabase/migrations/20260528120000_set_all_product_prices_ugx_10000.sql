-- Set all shop product prices to UGX 10,000.
-- Prices are stored in USD; the shop converts at 3,800 UGX per USD for display/checkout.
-- 10,000 / 3,800 keeps the displayed UGX price at exactly 10,000 at the default rate.

UPDATE public.products
SET
  regular_price_usd = 10000.0 / 3800.0,
  sale_price_usd = 0,
  price_usd = 10000.0 / 3800.0;

-- Clear variant price modifiers when the column exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_variants'
      AND column_name = 'price_modifier'
  ) THEN
    UPDATE public.product_variants SET price_modifier = 0;
  END IF;
END $$;
