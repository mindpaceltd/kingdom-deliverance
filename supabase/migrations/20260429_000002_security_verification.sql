-- Verification queries for RLS and storage policy setup.
-- Run manually after schema application.

-- Confirm RLS is enabled on key tables.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'posts', 'sermons', 'events', 'ministries', 'media', 'gallery', 'pages');

-- Confirm storage policies on media bucket exist.
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects';
