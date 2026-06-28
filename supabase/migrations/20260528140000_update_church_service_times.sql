-- Update church service times across site settings and CMS pages.

UPDATE public.site_settings
SET value = 'Sunday English Service — 8:00 AM – 10:00 AM
Sunday Luganda Service — 11:00 AM – 2:00 PM
Wednesday Bible Study — 9:00 PM
Friday Fire Service — 9:00 PM'
WHERE key = 'service_times';

UPDATE public.pages
SET content_json = jsonb_set(
  content_json,
  '{home,serviceSlots}',
  '[
    {"label":"Sunday English Service","time":"8:00 AM – 10:00 AM (EAT)"},
    {"label":"Sunday Luganda Service","time":"11:00 AM – 2:00 PM (EAT)"},
    {"label":"Bible Study","time":"Wed 9:00 PM (EAT)"},
    {"label":"Prayer Meeting","time":"Fri 9:00 PM (EAT)"}
  ]'::jsonb,
  true
)
WHERE slug IN ('home', '');

UPDATE public.pages
SET content_json = jsonb_set(
  content_json,
  '{contact,serviceTimes}',
  to_jsonb('Sunday English: 8:00 AM – 10:00 AM (EAT)
Sunday Luganda: 11:00 AM – 2:00 PM (EAT)
Wednesday: 9:00 PM (EAT)
Friday: 9:00 PM (EAT)'::text),
  true
)
WHERE slug = 'contact';
