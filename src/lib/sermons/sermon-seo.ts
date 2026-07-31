/**
 * Builds the SEO fields for an imported sermon so every record clears the
 * admin SEO checklist in src/lib/seo-scorer.ts without hand-editing.
 *
 * The scorer rewards a focus keyword that appears in the SEO title, the slug
 * and the first 200 characters of the content, plus a 50–60 character title
 * and a 150–160 character meta description. Rather than bolting the keyword on
 * as a prefix (which reads badly), the keyword is chosen as a phrase that is
 * already part of the sermon title, so the copy stays natural.
 */

import { computeSeoScore, type SeoChecks } from '@/lib/seo-scorer'
import { generateSlug } from '@/lib/utils'

const SEO_TITLE_MIN = 50
const SEO_TITLE_MAX = 60
const META_DESC_MIN = 150
const META_DESC_MAX = 160

/** Words that make a weak start or end to a focus keyword. */
const WEAK_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for', 'from',
  'had', 'has', 'have', 'he', 'her', 'his', 'i', 'in', 'is', 'it', 'its', 'me',
  'my', 'nor', 'of', 'on', 'or', 'our', 'shall', 'she', 'that', 'the', 'their',
  'them', 'they', 'this', 'to', 'today', 'tonight', 'up', 'us', 'was', 'we',
  'were', 'will', 'with', 'you', 'your',
])

/**
 * Title suffixes tried longest-first so the SEO title lands in the 50–60 band
 * with the most descriptive branding that still fits.
 */
const TITLE_SUFFIXES = [
  ' | Kingdom Deliverance Centre Uganda',
  ' | Kingdom Deliverance Uganda',
  ' | KDC Uganda Sermon Message',
  ' | Bishop Climate Wiseman',
  ' | Sermon | KDC Uganda',
  ' | KDC Uganda Sermon',
  ' | KDC Uganda',
]

const DESCRIPTION_FILLERS = [
  ' Watch or read the full message online.',
  ' Join Kingdom Deliverance Centre Uganda.',
  ' Worship with us in Kampala or online.',
  ' All are welcome.',
]

export interface SermonSeoInput {
  title: string
  /** Heuristic or AI-written summary of the manuscript. */
  summary: string
  /** Sermon body as HTML, straight from the manuscript parser. */
  html: string
  mainScripture?: string | null
  preacher?: string | null
  /** Keyword suggested by AI; used only when it reads as part of the title. */
  suggestedKeyword?: string | null
}

export interface SermonSeoResult {
  focusKeyword: string
  metaTitle: string
  metaDescription: string
  description: string
  /** Slug base — still needs de-duplicating against existing sermons. */
  slugBase: string
  /** Body HTML with a reference lead paragraph so the keyword opens the page. */
  content: string
  imageAlt: string
  score: number
  checks: SeoChecks
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Word processors drop line breaks between sentences, which extraction turns
 * into run-ons like "Kampala.Good evening". Restore the missing space.
 */
export function cleanRunOnText(value: string): string {
  return value
    .replace(/([.!?,;:])([A-Z“"'])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Split a title on punctuation so a keyword never straddles a comma or ampersand. */
function titleSegments(title: string): string[] {
  return title
    .split(/[,;:·|—–\-()[\]{}"“”]+|\s&\s|\sand\s/i)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 0)
}

function trimWeakEdges(words: string[]): string[] {
  const out = [...words]
  while (out.length > 1 && WEAK_WORDS.has(out[0].toLowerCase())) out.shift()
  while (out.length > 1 && WEAK_WORDS.has(out[out.length - 1].toLowerCase())) out.pop()
  return out
}

/**
 * Pick a 2–4 word phrase that is a literal part of the title, so the SEO title
 * and slug contain the keyword without any awkward prefixing.
 */
export function deriveSermonKeyword(title: string, suggested?: string | null): string {
  const normalisedTitle = title.replace(/\s+/g, ' ').trim()

  // Honour an AI suggestion only when the title genuinely contains it.
  const hint = (suggested || '').replace(/\s+/g, ' ').trim()
  if (hint && normalisedTitle.toLowerCase().includes(hint.toLowerCase())) {
    const hintWords = trimWeakEdges(hint.split(' '))
    if (hintWords.length >= 2) return hintWords.join(' ').toLowerCase()
  }

  const segments = titleSegments(normalisedTitle)
  // The longest punctuation-free run carries the substance of the title.
  const best = segments.sort((a, b) => b.split(' ').length - a.split(' ').length)[0] ?? normalisedTitle

  const words = trimWeakEdges(best.split(' ').filter(Boolean))
  const keyword = trimWeakEdges(words.slice(0, 4)).join(' ').toLowerCase()

  return keyword || generateSlug(normalisedTitle).replace(/-/g, ' ').slice(0, 40) || 'kingdom deliverance'
}

function trimToWordBoundary(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max)
  return (cut > max * 0.6 ? text.slice(0, cut) : text.slice(0, max)).trimEnd()
}

/** Compose a 50–60 character SEO title that still contains the focus keyword. */
export function buildSermonMetaTitle(title: string, focusKeyword: string): string {
  const base = title.replace(/\s+/g, ' ').trim()

  const fitted = TITLE_SUFFIXES.map((suffix) => `${base}${suffix}`)
    .filter((candidate) => candidate.length >= SEO_TITLE_MIN && candidate.length <= SEO_TITLE_MAX)
    // Prefer the most descriptive branding that still fits the band.
    .sort((a, b) => b.length - a.length)[0]
  if (fitted) return fitted

  if (base.length >= SEO_TITLE_MIN && base.length <= SEO_TITLE_MAX) return base

  if (base.length > SEO_TITLE_MAX) {
    const trimmed = trimToWordBoundary(base, SEO_TITLE_MAX)
    if (trimmed.length >= SEO_TITLE_MIN) return trimmed
    // A single very long word: hard-cut rather than fall below the band.
    return base.slice(0, SEO_TITLE_MAX)
  }

  // Title is too short even with the longest suffix — pad with branding.
  let out = `${base}${TITLE_SUFFIXES[0]}`
  if (out.length > SEO_TITLE_MAX) out = trimToWordBoundary(out, SEO_TITLE_MAX)
  while (out.length < SEO_TITLE_MIN) out += ' Sermon'
  return out.slice(0, SEO_TITLE_MAX)
}

/** Manuscripts repeat their title as the first line; don't say it twice. */
function stripLeadingTitle(summary: string, title: string): string {
  if (!title || !summary.toLowerCase().startsWith(title.toLowerCase())) return summary
  return summary.slice(title.length).replace(/^[\s:;,.\-–—]+/, '')
}

/** Compose a 150–160 character meta description containing the focus keyword. */
export function buildSermonMetaDescription(
  title: string,
  summary: string,
  focusKeyword: string
): string {
  const cleanTitle = cleanRunOnText(title)
  const body = stripLeadingTitle(cleanRunOnText(summary), cleanTitle)

  // Leading with the title guarantees the keyword appears, and reads naturally.
  let base = body.toLowerCase().includes(focusKeyword.toLowerCase())
    ? body
    : body
      ? `${cleanTitle}: ${body}`
      : cleanTitle

  if (base.length > META_DESC_MAX) {
    // Reserve a character for the ellipsis that marks the clipped sentence.
    base = trimToWordBoundary(base, META_DESC_MAX - 1).replace(/[\s,;:–—-]+$/, '')
    if (!/[.!?]$/.test(base)) base += '…'
  }

  for (const filler of DESCRIPTION_FILLERS) {
    if (base.length >= META_DESC_MIN) break
    if (base.length + filler.length <= META_DESC_MAX) base += filler
  }

  // Still short: extend with the ministry line rather than pad with noise.
  if (base.length < META_DESC_MIN) {
    base = trimToWordBoundary(`${base} Kingdom Deliverance Centre Uganda, Kampala.`, META_DESC_MAX)
  }

  return base.slice(0, META_DESC_MAX)
}

/**
 * Prefix the body with a reference line naming the sermon, scripture and
 * preacher. It is useful on the page in its own right and puts the focus
 * keyword inside the first 200 characters the scorer inspects.
 */
export function buildSermonContent(input: {
  html: string
  title: string
  mainScripture?: string | null
  preacher?: string | null
}): string {
  const parts = [`Sermon: <strong>${escapeHtml(input.title)}</strong>`]
  if (input.mainScripture) parts.push(`Scripture: ${escapeHtml(input.mainScripture)}`)
  if (input.preacher) parts.push(`Preached by ${escapeHtml(input.preacher)}`)

  const lead = `<p class="sermon-reference"><em>${parts.join(' · ')}</em></p>`
  return `${lead}\n${input.html.trim()}`
}

/** Build every SEO field for an imported sermon and score the result. */
export function buildSermonSeo(input: SermonSeoInput): SermonSeoResult {
  const title = cleanRunOnText(input.title)
  const focusKeyword = deriveSermonKeyword(title, input.suggestedKeyword)

  const metaTitle = buildSermonMetaTitle(title, focusKeyword)
  const description = cleanRunOnText(input.summary)
  const metaDescription = buildSermonMetaDescription(title, description, focusKeyword)
  const content = buildSermonContent({
    html: input.html,
    title,
    mainScripture: input.mainScripture,
    preacher: input.preacher,
  })

  // The slug must contain the keyword; the title normally already covers it.
  const keywordSlug = generateSlug(focusKeyword)
  let slugBase = generateSlug(title)
  if (keywordSlug && !slugBase.includes(keywordSlug)) {
    slugBase = `${keywordSlug}-${slugBase}`.replace(/-+/g, '-').replace(/^-+|-+$/g, '')
  }
  slugBase = slugBase.slice(0, 90).replace(/-+$/g, '') || keywordSlug || 'sermon'

  const imageAlt = `${title} — sermon by ${input.preacher || 'Bishop Climate Wiseman'} at Kingdom Deliverance Centre Uganda`

  // Scored without an image; the importer adds the image points once a
  // thumbnail is resolved.
  const { score, checks } = computeSeoScore({
    focusKeyword,
    seoTitle: metaTitle,
    metaDescription,
    content,
    slug: slugBase,
    featuredImage: '',
  })

  return {
    focusKeyword,
    metaTitle,
    metaDescription,
    description,
    slugBase,
    content,
    imageAlt,
    score,
    checks,
  }
}
