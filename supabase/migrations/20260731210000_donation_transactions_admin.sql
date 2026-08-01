-- Payment attempts linked to donations (Pesapal / PayPal)
CREATE TABLE IF NOT EXISTS public.donation_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL CHECK (gateway IN ('pesapal', 'paypal')),
  reference TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donation_transactions_donation
  ON public.donation_transactions (donation_id);

CREATE INDEX IF NOT EXISTS idx_donation_transactions_gateway
  ON public.donation_transactions (gateway);

CREATE INDEX IF NOT EXISTS idx_donation_transactions_reference
  ON public.donation_transactions (reference);

CREATE INDEX IF NOT EXISTS idx_donations_status_created
  ON public.donations (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_donations_is_anonymous
  ON public.donations (is_anonymous);

ALTER TABLE public.donation_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'donation_transactions' AND policyname = 'Only admins can view donation transactions'
  ) THEN
    CREATE POLICY "Only admins can view donation transactions"
      ON public.donation_transactions FOR SELECT
      USING (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'donation_transactions' AND policyname = 'Admins can update donation transactions'
  ) THEN
    CREATE POLICY "Admins can update donation transactions"
      ON public.donation_transactions FOR UPDATE
      USING (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'donation_transactions' AND policyname = 'Service can insert donation transactions'
  ) THEN
    CREATE POLICY "Service can insert donation transactions"
      ON public.donation_transactions FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
