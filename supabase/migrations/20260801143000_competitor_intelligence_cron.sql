-- Competitor Intelligence cron settings + optional Supabase pg_cron hooks

INSERT INTO public.dm_settings (key, value, updated_at)
VALUES
  ('competitor_report_emails', '[]'::jsonb, now()),
  ('competitor_cron_capture_enabled', 'true'::jsonb, now()),
  ('competitor_cron_report_enabled', 'true'::jsonb, now())
ON CONFLICT (key) DO NOTHING;

-- Optional: schedule HTTP calls to the Next.js cron routes when pg_cron + pg_net are enabled.
-- Set dm_settings.competitor_cron_base_url to your production origin (e.g. https://kdcuganda.org)
-- and store CRON_SECRET in Supabase Vault as competitor_cron_secret for Authorization header.

DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('competitor-intelligence-capture');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      PERFORM cron.unschedule('competitor-intelligence-report');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(
      'competitor-intelligence-capture',
      '0 5 * * *',
      $job$
      SELECT net.http_post(
        url := coalesce(
          (SELECT value->>'base_url' FROM public.dm_settings WHERE key = 'competitor_cron_webhook'),
          ''
        ) || '/api/digital-ministry/cron/competitors/capture',
        headers := jsonb_build_object(
          'Authorization',
          'Bearer ' || coalesce(
            (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'competitor_cron_secret' LIMIT 1),
            ''
          )
        ),
        body := '{}'::jsonb
      ) AS request_id
      WHERE coalesce(
        (SELECT value->>'base_url' FROM public.dm_settings WHERE key = 'competitor_cron_webhook'),
        ''
      ) <> '';
      $job$
    );

    PERFORM cron.schedule(
      'competitor-intelligence-report',
      '0 7 * * 1',
      $job$
      SELECT net.http_post(
        url := coalesce(
          (SELECT value->>'base_url' FROM public.dm_settings WHERE key = 'competitor_cron_webhook'),
          ''
        ) || '/api/digital-ministry/cron/competitors/report',
        headers := jsonb_build_object(
          'Authorization',
          'Bearer ' || coalesce(
            (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'competitor_cron_secret' LIMIT 1),
            ''
          )
        ),
        body := '{}'::jsonb
      ) AS request_id
      WHERE coalesce(
        (SELECT value->>'base_url' FROM public.dm_settings WHERE key = 'competitor_cron_webhook'),
        ''
      ) <> '';
      $job$
    );
  END IF;
EXCEPTION
  WHEN undefined_table OR undefined_object OR invalid_schema_name THEN
    RAISE NOTICE 'pg_cron/pg_net/vault not available — use Vercel cron routes instead';
  WHEN OTHERS THEN
    RAISE NOTICE 'Competitor cron schedule skipped: %', SQLERRM;
END;
$cron$;
