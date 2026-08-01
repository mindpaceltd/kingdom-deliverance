/**
 * Bulk-import sermon manuscripts into Supabase as drafts.
 * Usage: npx tsx scripts/bulk-import-sermons.mts "/path/to/Sermons folder"
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

const dir = process.argv[2]
if (!dir) {
  console.error('Usage: npx tsx scripts/bulk-import-sermons.mts "/path/to/folder"')
  process.exit(1)
}

for (const envFile of ['.env.vercel.production', '.env.local', '.env.vercel']) {
  const resolved = path.resolve(process.cwd(), envFile)
  if (fs.existsSync(resolved)) {
    Object.assign(process.env, dotenv.parse(fs.readFileSync(resolved)))
    console.log(`Loaded env from ${envFile}`)
    break
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const { extractManuscriptText, parseManuscript } = await import('../src/lib/sermons/manuscript.ts')
const { buildSermonSeo } = await import('../src/lib/sermons/sermon-seo.ts')
const { normalizeSermonTitle } = await import('../src/lib/dedupe/normalize.ts')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const PREACHER = 'Bishop Climate Wiseman'

async function findExistingSermonByTitle(title: string) {
  const normalized = normalizeSermonTitle(title)
  if (!normalized) return null
  const { data } = await supabase.from('sermons').select('id, slug, title').is('deleted_at', null)
  for (const row of data ?? []) {
    if (normalizeSermonTitle(String(row.title ?? '')) === normalized) {
      return row as { id: string; slug: string; title: string }
    }
  }
  return null
}

function fileKey(name: string) {
  return name.replace(/\.[^.]+$/, '').trim().toLowerCase()
}

async function reserveSlug(base: string): Promise<string> {
  const safeBase = base || 'sermon'
  const { data } = await supabase.from('sermons').select('slug').like('slug', `${safeBase}%`)
  const taken = new Set((data ?? []).map((r) => r.slug as string))
  if (!taken.has(safeBase)) return safeBase
  for (let i = 2; i < 200; i++) {
    const candidate = `${safeBase}-${i}`
    if (!taken.has(candidate)) return candidate
  }
  return `${safeBase}-${Date.now().toString(36)}`
}

const allFiles = fs
  .readdirSync(dir)
  .filter((f) => /\.(docx|pdf|txt|md)$/i.test(f))
  .sort()

const byKey = new Map<string, string[]>()
for (const file of allFiles) {
  const key = fileKey(file)
  const list = byKey.get(key) ?? []
  list.push(file)
  byKey.set(key, list)
}

const toImport: string[] = []
for (const [, group] of byKey) {
  const preferred =
    group.find((f) => /\.docx$/i.test(f)) ??
    group.find((f) => /\.txt$/i.test(f)) ??
    group[0]
  toImport.push(preferred)
}

console.log(`Importing ${toImport.length} sermons as drafts…\n`)

let ok = 0
let failed = 0
let skipped = 0

for (const file of toImport) {
  const buffer = fs.readFileSync(path.join(dir, file))
  const extracted = await extractManuscriptText(buffer, file)
  if ('error' in extracted) {
    console.log(`✗ ${file}: ${extracted.error}`)
    failed++
    continue
  }

  const parsed = parseManuscript(extracted.text, file)
  if (parsed.wordCount < 50) {
    console.log(`✗ ${file}: only ${parsed.wordCount} words found`)
    failed++
    continue
  }

  const existingByTitle = await findExistingSermonByTitle(parsed.title)
  if (existingByTitle) {
    console.log(`↷ ${file}: skipped — already exists (${existingByTitle.title})`)
    skipped++
    continue
  }

  const seo = buildSermonSeo({
    title: parsed.title,
    summary: parsed.summary,
    html: parsed.html,
    mainScripture: parsed.mainScripture,
    preacher: PREACHER,
  })

  const slug = await reserveSlug(seo.slugBase)

  const { data: existing } = await supabase
    .from('sermons')
    .select('id, title, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    console.log(`↷ ${file}: skipped — slug already exists (${existing.title})`)
    skipped++
    continue
  }

  const { data: sermon, error } = await supabase
    .from('sermons')
    .insert({
      title: parsed.title,
      slug,
      description: seo.description || null,
      content: seo.content,
      preacher: PREACHER,
      date: parsed.detectedDate || new Date().toISOString().slice(0, 10),
      duration_minutes: parsed.estimatedMinutes,
      status: 'draft',
      published_at: null,
      scheduled_at: null,
      featured_image_alt: seo.imageAlt,
      meta_title: seo.metaTitle,
      meta_description: seo.metaDescription,
      focus_keyword: seo.focusKeyword,
      seo_score: seo.score,
    })
    .select('id, slug')
    .single()

  if (error || !sermon) {
    console.log(`✗ ${file}: ${error?.message ?? 'insert failed'}`)
    failed++
    continue
  }

  console.log(`✓ ${file}`)
  console.log(`   title     : ${parsed.title}`)
  console.log(`   slug      : ${sermon.slug}`)
  console.log(`   seo       : ${seo.score}/100`)
  console.log(`   id        : ${sermon.id}`)
  console.log()
  ok++
}

console.log(`Done: ${ok} imported, ${failed} failed, ${skipped} skipped (duplicates)`)
