-- Seed site-wide SEO keywords (editable in Admin → Settings → SEO).
-- Migrates legacy site_keywords if present.

DO $$
DECLARE
  keywords TEXT := 'KDC, KDC Uganda, Kingdom Deliverance Centre, Kingdom Deliverance Center, Kingdom Deliverance Centre Uganda, Kingdom Deliverance Center Uganda, Kampala church, church in Kampala, church Uganda, Kosovo church, Kosovo Lungujja church, Christian church Kosovo Lungujja, Pentecostal church Uganda, Pentecostal church Kampala, Bishop Climate Wiseman, Bishop Climate, Fire Service, Fire Service Kampala, Fire Service Uganda, KDC Fire Service, Fire Service prayer, deliverance ministry Uganda, healing church Kampala, deliverance church Kampala, prayer ministry Kampala, worship Kampala, Bible study Uganda, live church service Uganda, church live stream Uganda, Sunday service Kampala, KDC sermons, Kingdom Temple Uganda';
  legacy TEXT;
BEGIN
  SELECT value INTO legacy FROM public.site_settings WHERE key = 'site_keywords' LIMIT 1;

  IF legacy IS NOT NULL AND trim(legacy) <> '' THEN
    keywords := legacy;
  END IF;

  INSERT INTO public.site_settings (key, value)
  VALUES ('site_meta_keywords', keywords)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
END $$;
