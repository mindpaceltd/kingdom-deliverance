-- Sync Contact page address from site_settings when still using the seeded default.

UPDATE public.pages p
SET
  content_json = jsonb_set(
    COALESCE(p.content_json, '{}'::jsonb),
    '{contact,address}',
    to_jsonb(trim(s.value)),
    true
  ),
  updated_at = NOW()
FROM public.site_settings s
WHERE p.slug = 'contact'
  AND s.key = 'address'
  AND NULLIF(trim(s.value), '') IS NOT NULL
  AND (
    COALESCE(p.content_json->'contact'->>'address', '') ILIKE '%Kingdom Deliverance Centre%'
    OR COALESCE(p.content_json->'contact'->>'address', '') = ''
  );
