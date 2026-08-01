-- ============================================================
-- Advisor security fix: enable RLS on public tables missing it
-- ============================================================
-- Supabase Advisor flagged routes, route_clients, route_drivers, and
-- collections (legacy logistics tables). The same audit also catches other
-- exposed public tables that never had RLS enabled in migrations.
--
-- Policies:
--   • Staff-only for unused / legacy operational tables.
--   • page_views: public INSERT (analytics from server actions), staff SELECT.

DO $$
DECLARE
  t RECORD;
  staff_only_tables TEXT[] := ARRAY[
    'routes',
    'route_clients',
    'route_drivers',
    'collections',
    'audit_log',
    'complaints',
    'notifications',
    'payments',
    'sms_log'
  ];
  table_name TEXT;
BEGIN
  -- Ensure staff helper exists (support-chat migration may have been skipped).
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_staff_user'
  ) THEN
    CREATE OR REPLACE FUNCTION public.is_staff_user()
    RETURNS BOOLEAN
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $func$
      SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'editor', 'author')
      );
    $func$;
  END IF;

  FOREACH table_name IN ARRAY staff_only_tables
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = table_name
        AND n.nspname = 'public'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);

      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I;',
        ('Staff manage ' || table_name),
        table_name
      );

      EXECUTE format(
        'CREATE POLICY %I ON public.%I
         FOR ALL
         USING (public.is_staff_user())
         WITH CHECK (public.is_staff_user());',
        ('Staff manage ' || table_name),
        table_name
      );
    END IF;
  END LOOP;

  -- Analytics: allow anonymous inserts from public pages; staff read dashboards.
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'page_views'
      AND n.nspname = 'public'
  ) THEN
    ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can record page views" ON public.page_views;
    CREATE POLICY "Anyone can record page views"
      ON public.page_views
      FOR INSERT
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Staff can view page views" ON public.page_views;
    CREATE POLICY "Staff can view page views"
      ON public.page_views
      FOR SELECT
      USING (public.is_staff_user());
  END IF;
END $$;
