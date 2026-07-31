-- ============================================================
-- Order pipeline fixes
--   1. Staff can read/manage orders by role instead of a hardcoded email
--   2. Allow the 'free' and 'manual' gateway values the app already writes
-- ============================================================

-- Ensure the staff helper exists even if the support-chat migration was skipped.
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor', 'author')
  );
$$;

-- ── 1. Role-based staff access ────────────────────────────────────────────────
-- The previous policy was tied to the literal email admin@kdcuganda.org, so any
-- other staff account saw an empty orders list.
DROP POLICY IF EXISTS "Admin full access orders" ON public.orders;
DROP POLICY IF EXISTS "Staff manage orders" ON public.orders;
CREATE POLICY "Staff manage orders" ON public.orders
  FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Admin full access order_items" ON public.order_items;
DROP POLICY IF EXISTS "Staff manage order items" ON public.order_items;
CREATE POLICY "Staff manage order items" ON public.order_items
  FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Admin full access transactions" ON public.transactions;
DROP POLICY IF EXISTS "Staff manage transactions" ON public.transactions;
CREATE POLICY "Staff manage transactions" ON public.transactions
  FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

-- ── 2. Gateway values ─────────────────────────────────────────────────────────
-- Free (fully discounted) orders and manually recorded payments were rejected by
-- the original CHECK constraint, losing the transaction record.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'transactions'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%gateway%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.transactions DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_gateway_check
  CHECK (gateway IN ('pesapal', 'paypal', 'free', 'manual'));
