INSERT INTO public.pages (title, slug, content_json, status)
VALUES
  (
    'Home Page',
    '',
    '{"sections":[{"type":"hero","title":"Welcome to Kingdom Deliverance Centre Uganda"},{"type":"featured_sermons","limit":3},{"type":"featured_events","limit":3}]}'::jsonb,
    'published'
  ),
  (
    'About Page',
    'about',
    '{"sections":[{"type":"hero","title":"About Us"},{"type":"rich_text","content":"Mission and vision content."}]}'::jsonb,
    'draft'
  )
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  content_json = EXCLUDED.content_json,
  status = EXCLUDED.status;
