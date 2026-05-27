-- Leads from Live Support and related contact capture

ALTER TABLE public.support_conversations
  ADD COLUMN IF NOT EXISTS visitor_phone TEXT;

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'live_support',
  support_conversation_id UUID REFERENCES public.support_conversations(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT leads_contact_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS leads_support_conversation_uidx
  ON public.leads (support_conversation_id)
  WHERE support_conversation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_created_at_idx
  ON public.leads (created_at DESC);

CREATE INDEX IF NOT EXISTS leads_source_idx
  ON public.leads (source);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.is_staff_user());

CREATE POLICY "Staff update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (public.is_staff_user());
