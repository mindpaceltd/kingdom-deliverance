-- Blog listing categories (public /blog filters)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'teachings';

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_category_check
  CHECK (category IN ('sermons', 'teachings', 'testimonies', 'news', 'bishop', 'general'));

CREATE INDEX IF NOT EXISTS posts_category_idx ON public.posts (category);

-- Backfill existing published content
UPDATE public.posts SET category = 'news' WHERE type = 'news';

UPDATE public.posts SET category = 'bishop'
WHERE category = 'teachings'
  AND (
    title ILIKE '%climate wiseman%'
    OR title ILIKE '%dr climate%'
    OR title ILIKE '%prophet climate%'
  );

UPDATE public.posts SET category = 'teachings'
WHERE title ILIKE '%code of the spirit%'
   OR title ILIKE '%numbers 1 to 5%';

UPDATE public.posts SET category = 'testimonies'
WHERE title ILIKE '%captives%'
   OR title ILIKE '%set free%';
