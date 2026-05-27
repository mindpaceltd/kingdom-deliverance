-- Remove stale CMS placeholder intro on the Contact page and align address with site_settings.

UPDATE public.pages
SET
  content_json = content_json - 'contactIntroHtml',
  updated_at = NOW()
WHERE slug = 'contact'
  AND content_json ? 'contactIntroHtml'
  AND (
    content_json->>'contactIntroHtml' ILIKE '%Settings → General%'
    OR content_json->>'contactIntroHtml' ILIKE '%Settings -> General%'
  );

UPDATE public.pages p
SET
  content_json = jsonb_set(
    COALESCE(p.content_json, '{}'::jsonb),
    '{contact,address}',
    to_jsonb(s.value::text),
    true
  ),
  updated_at = NOW()
FROM public.site_settings s
WHERE p.slug = 'contact'
  AND s.key = 'address'
  AND NULLIF(trim(s.value), '') IS NOT NULL
  AND (
    p.content_json->'contact'->>'address' IS NULL
    OR p.content_json->'contact'->>'address' = 'Kingdom Deliverance Centre Uganda\nKampala, Uganda'
  );

UPDATE public.pages p
SET
  content_json = jsonb_set(
    COALESCE(p.content_json, '{}'::jsonb),
    '{contact,primaryPhone}',
    to_jsonb(s.value::text),
    true
  ),
  updated_at = NOW()
FROM public.site_settings s
WHERE p.slug = 'contact'
  AND s.key = 'contact_phone'
  AND NULLIF(trim(s.value), '') IS NOT NULL
  AND (
    p.content_json->'contact'->>'primaryPhone' IS NULL
    OR p.content_json->'contact'->>'primaryPhone' = '+256 700 000 000'
  );
