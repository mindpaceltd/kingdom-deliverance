-- ============================================================
-- Advisor security fix: enable RLS on critical tables
-- ============================================================
-- The Supabase Advisor flagged these tables as having RLS disabled in `public`.
-- This migration enables RLS and adds conservative policies:
-- - Admin full access via JWT email claim (matches other ecommerce migrations).
-- - Owner access when common linking columns exist (e.g. `user_id` or `id`).
--
-- Note: We guard policy creation with column-existence checks to avoid failures
-- if the table uses different column names.

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'clients'::text,
      'contracts'::text,
      'users'::text,
      'invoices'::text
    ]) AS table_name
  LOOP
    -- Enable RLS if the table exists
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = t.table_name
        AND n.nspname = 'public'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.table_name);
    END IF;

    -- Admin full access policy (safe fallback)
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = t.table_name
        AND n.nspname = 'public'
    ) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I;',
        ('Admin full access ' || t.table_name),
        t.table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I
         FOR ALL
         USING (auth.jwt() ->> ''email'' = ''admin@kdcuganda.org'')
         WITH CHECK (auth.jwt() ->> ''email'' = ''admin@kdcuganda.org'');',
        ('Admin full access ' || t.table_name),
        t.table_name
      );
    END IF;

    -- Owner access policies
    IF t.table_name IN ('clients', 'contracts', 'invoices') THEN
      -- If `user_id` exists, allow owner to view their own rows.
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = t.table_name
          AND column_name = 'user_id'
      ) THEN
        EXECUTE format(
          'DROP POLICY IF EXISTS %I ON public.%I;',                                    
          ('Owner can manage ' || t.table_name),                                       
          t.table_name                                                                 
        );
        EXECUTE format(
          'CREATE POLICY %I ON public.%I                                               
           FOR ALL
           USING (user_id = auth.uid())
           WITH CHECK (user_id = auth.uid());',
          ('Owner can manage ' || t.table_name),                                       
          t.table_name                                                                 
        );
      END IF;
    END IF;

    IF t.table_name = 'users' THEN
      -- For a `public.users` table, try `id` then `user_id`.
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'id'
      ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Owner can manage users" ON public.users;';
        EXECUTE 'CREATE POLICY "Owner can manage users" ON public.users
                 FOR ALL
                 USING (id = auth.uid())
                 WITH CHECK (id = auth.uid());';
      ELSIF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'user_id'
      ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Owner can manage users" ON public.users;';
        EXECUTE 'CREATE POLICY "Owner can manage users" ON public.users
                 FOR ALL
                 USING (user_id = auth.uid())
                 WITH CHECK (user_id = auth.uid());';
      END IF;
    END IF;
  END LOOP;
END $$;

