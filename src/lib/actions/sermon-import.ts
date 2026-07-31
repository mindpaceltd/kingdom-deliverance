'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'
import { generateSlug } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { revalidateSitemap } from '@/lib/seo/revalidate-sitemap'
import { extractManuscriptText, parseManuscript } from '@/lib/sermons/manuscript'
import { generateGeminiJson } from '@/lib/digital-ministry/gemini'

export interface SermonImportOptions {
  status: 'draft' | 'published' | 'scheduled'
  /** ISO timestamp — only used when status is 'scheduled'. */
  scheduledAt?: string | null
  /** Service/preaching date shown on the sermon. Defaults to the detected or today's date. */
  date?: string | null
  preacher?: string
  seriesId?: string | null
  /** Enrich the description and SEO fields with Gemini when a key is configured. */
  useAi?: boolean
}

export interface SermonImportResult {
  filename: string
  id: string
  slug: string
  title: string
  status: string
  scheduledAt: string | null
  wordCount: number
  estimatedMinutes: number
  mainScripture: string | null
  aiEnriched: boolean
  /** Non-fatal notes, e.g. AI unavailable so heuristics were used. */
  notice?: string
}

interface AiSermonFields {
  description: string
  meta_title: string
  meta_description: string
  focus_keyword: string
}

/** Whether AI enrichment can run at all, plus the series available for assignment. */
export async function getSermonImportContext(): Promise<{
  aiAvailable: boolean
  series: { id: string; name: string }[]
  defaultPreacher: string
}> {
  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) {
    return { aiAvailable: false, series: [], defaultPreacher: 'Bishop Climate Wiseman' }
  }

  const supabase = createAdminClient()
  const { data } = await supabase.from('sermon_series').select('id, name').order('name')

  return {
    aiAvailable: Boolean(process.env.GEMINI_API_KEY),
    series: data ?? [],
    defaultPreacher: 'Bishop Climate Wiseman',
  }
}

/**
 * Reserve a slug that is not already taken. Existing slugs sharing the base are
 * fetched in one query rather than probing the database once per candidate.
 */
async function reserveSlug(
  supabase: ReturnType<typeof createAdminClient>,
  base: string
): Promise<string> {
  const safeBase = base || 'sermon'
  const { data } = await supabase
    .from('sermons')
    .select('slug')
    .like('slug', `${safeBase}%`)

  const taken = new Set((data ?? []).map((r) => r.slug as string))
  if (!taken.has(safeBase)) return safeBase

  for (let i = 2; i < 200; i++) {
    const candidate = `${safeBase}-${i}`
    if (!taken.has(candidate)) return candidate
  }

  return `${safeBase}-${Date.now().toString(36)}`
}

function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

async function enrichWithAi(params: {
  title: string
  scripture: string | null
  text: string
  userId: string | null
}): Promise<AiSermonFields | null> {
  const prompt = `You are writing website copy for Kingdom Deliverance Centre, a Pentecostal deliverance ministry in Kampala, Uganda led by Master Prophet Climate Wiseman.

Below is the manuscript of a sermon titled "${params.title}".${
    params.scripture ? ` Its main scripture is ${params.scripture}.` : ''
  }

Write metadata for the sermon page. Keep the pastoral, prophetic voice of the ministry. Do not invent facts, quotes, or scripture that are not in the manuscript.

Return ONLY valid JSON with exactly these keys:
{
  "description": "2-3 sentence summary that makes a visitor want to watch or read, max 300 characters",
  "meta_title": "SEO title, max 60 characters, includes the strongest keyword",
  "meta_description": "SEO meta description, 140-160 characters",
  "focus_keyword": "the single strongest search phrase, 2-5 words, lowercase"
}

MANUSCRIPT:
${params.text.slice(0, 12000)}`

  const result = await generateGeminiJson<AiSermonFields>({
    prompt,
    agent: 'sermon_import',
    userId: params.userId,
    inputType: 'sermon_manuscript',
  })

  if ('error' in result) {
    console.warn('[sermon-import] AI enrichment failed:', result.error)
    return null
  }

  const d = result.data
  if (!d?.description || !d?.meta_title) return null

  return {
    description: truncate(String(d.description), 300),
    meta_title: truncate(String(d.meta_title), 60),
    meta_description: truncate(String(d.meta_description ?? d.description), 160),
    focus_keyword: truncate(String(d.focus_keyword ?? params.title).toLowerCase(), 60),
  }
}

/**
 * Parse one uploaded manuscript and create the matching sermon record.
 * Called once per file so the UI can report progress and partial failures.
 */
export async function importSermonManuscript(input: {
  filename: string
  /** Base64-encoded file contents. */
  data: string
  options: SermonImportOptions
}): Promise<SermonImportResult | { error: string; filename: string }> {
  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) return { error: auth.error, filename: input.filename }

  let buffer: Buffer
  try {
    buffer = Buffer.from(input.data, 'base64')
  } catch {
    return { error: 'File could not be decoded.', filename: input.filename }
  }

  if (!buffer.length) {
    return { error: 'File is empty.', filename: input.filename }
  }

  const extracted = await extractManuscriptText(buffer, input.filename)
  if ('error' in extracted) {
    return { error: extracted.error, filename: input.filename }
  }

  const parsed = parseManuscript(extracted.text, input.filename)

  if (parsed.wordCount < 50) {
    return {
      error: `Only ${parsed.wordCount} words of text were found — the file may be scanned images rather than text.`,
      filename: input.filename,
    }
  }

  const supabase = createAdminClient()
  const slug = await reserveSlug(supabase, generateSlug(parsed.title))

  let notice: string | undefined
  let ai: AiSermonFields | null = null
  if (input.options.useAi) {
    if (!process.env.GEMINI_API_KEY) {
      notice = 'AI is not configured, so the summary was built from the manuscript.'
    } else {
      ai = await enrichWithAi({
        title: parsed.title,
        scripture: parsed.mainScripture,
        text: parsed.text,
        userId: auth.id ?? null,
      })
      if (!ai) notice = 'AI enrichment failed, so the summary was built from the manuscript.'
    }
  }

  const description = ai?.description ?? parsed.summary
  const status = input.options.status
  const scheduledAt = status === 'scheduled' ? (input.options.scheduledAt ?? null) : null

  const { data: sermon, error } = await supabase
    .from('sermons')
    .insert({
      title: parsed.title,
      slug,
      description: description || null,
      content: parsed.html,
      preacher: input.options.preacher?.trim() || 'Bishop Climate Wiseman',
      series_id: input.options.seriesId || null,
      date: input.options.date || parsed.detectedDate || new Date().toISOString().slice(0, 10),
      duration_minutes: parsed.estimatedMinutes,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      scheduled_at: scheduledAt,
      meta_title: ai?.meta_title ?? truncate(parsed.title, 60),
      meta_description: ai?.meta_description ?? truncate(description, 160),
      focus_keyword: ai?.focus_keyword ?? generateSlug(parsed.title).replace(/-/g, ' ').slice(0, 60),
    })
    .select('id')
    .single()

  if (error || !sermon) {
    console.error('[sermon-import] insert failed', error, { filename: input.filename, slug })
    return { error: error?.message ?? 'Could not save the sermon.', filename: input.filename }
  }

  revalidatePath('/sermons')
  revalidatePath('/admin/sermons')
  if (status === 'published') revalidateSitemap()

  return {
    filename: input.filename,
    id: sermon.id as string,
    slug,
    title: parsed.title,
    status,
    scheduledAt,
    wordCount: parsed.wordCount,
    estimatedMinutes: parsed.estimatedMinutes,
    mainScripture: parsed.mainScripture,
    aiEnriched: Boolean(ai),
    notice,
  }
}
