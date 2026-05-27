-- Live support chat (visitor widget + admin inbox)

CREATE TABLE IF NOT EXISTS public.support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_token TEXT NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'pending', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_message_preview TEXT,
  unread_staff_count INTEGER NOT NULL DEFAULT 0,
  unread_visitor_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS support_conversations_last_message_idx
  ON public.support_conversations (last_message_at DESC);

CREATE INDEX IF NOT EXISTS support_conversations_status_idx
  ON public.support_conversations (status);

CREATE INDEX IF NOT EXISTS support_conversations_visitor_token_idx
  ON public.support_conversations (visitor_token);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent', 'bot')),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS support_messages_conversation_idx
  ON public.support_messages (conversation_id, created_at ASC);

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

ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Staff can manage all support conversations
CREATE POLICY "Staff read support conversations"
  ON public.support_conversations FOR SELECT
  TO authenticated
  USING (public.is_staff_user());

CREATE POLICY "Staff update support conversations"
  ON public.support_conversations FOR UPDATE
  TO authenticated
  USING (public.is_staff_user());

-- Staff read/write all messages
CREATE POLICY "Staff read support messages"
  ON public.support_messages FOR SELECT
  TO authenticated
  USING (public.is_staff_user());

CREATE POLICY "Staff insert support messages"
  ON public.support_messages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff_user());

-- Realtime (enable in Supabase Dashboard → Database → Publications if this fails)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
