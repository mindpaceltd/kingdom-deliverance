/**
 * Generates supabase/migrations/*_seed_home_faq_cms_pages.sql from current TS defaults.
 * Run: npx tsx scripts/generate-home-faq-seed-migration.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { buildContentJson } from '../src/lib/cms/page-content'
import {
  getFaqSystemPageContent,
  getHomeSystemPageContent,
} from '../src/lib/cms/seed-home-faq-pages'

const migrationName = '20260527220000_seed_faq_cms_published.sql'
const outPath = path.join(process.cwd(), 'supabase', 'migrations', migrationName)

function sqlJson(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/'/g, "''")
}

const homeJson = sqlJson(buildContentJson(getHomeSystemPageContent()))
const faqJson = sqlJson(buildContentJson(getFaqSystemPageContent()))

const sql = `-- Seed Homepage and FAQ CMS content for Admin → Pages (both published on live site).

UPDATE public.pages
SET
  title = 'Homepage',
  slug = 'home',
  content_json = '${homeJson}'::jsonb,
  status = 'published',
  updated_at = NOW()
WHERE slug IN ('home', '');

INSERT INTO public.pages (title, slug, content_json, status, updated_at)
SELECT 'Homepage', 'home', '${homeJson}'::jsonb, 'published', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.pages WHERE slug IN ('home', '')
);

UPDATE public.pages
SET
  title = 'FAQ',
  content_json = '${faqJson}'::jsonb,
  status = 'published',
  updated_at = NOW()
WHERE slug = 'faq';

INSERT INTO public.pages (title, slug, content_json, status, updated_at)
SELECT 'FAQ', 'faq', '${faqJson}'::jsonb, 'published', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.pages WHERE slug = 'faq');
`

fs.writeFileSync(outPath, sql, 'utf8')
console.log(`Wrote ${outPath} (${sql.length} bytes)`)
