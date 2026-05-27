import type { AiGenerateResult } from '@/lib/actions/ai'
import { computeSeoScore } from '@/lib/seo-scorer'
import { generateSlug } from '@/lib/utils'

const SEO_TITLE_MIN = 50
const SEO_TITLE_MAX = 60
const META_DESC_MIN = 150
const META_DESC_MAX = 160
const MIN_CONTENT_WORDS = 300
const INTRO_CHAR_LIMIT = 200

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'of', 'at', 'in', 'to', 'on', 'with', 'by',
])

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function wordCountFromHtml(html: string): number {
  const plain = stripHtml(html)
  if (!plain) return 0
  return plain.split(/\s+/).filter(Boolean).length
}

function trimToMax(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  const cut = text.lastIndexOf(' ', maxLen)
  if (cut >= maxLen * 0.6) return text.slice(0, cut).trimEnd()
  return text.slice(0, maxLen).trimEnd()
}

function ensureKeywordInText(text: string, focusKeyword: string): string {
  const kw = focusKeyword.trim()
  if (!kw) return text
  if (text.toLowerCase().includes(kw.toLowerCase())) return text
  return `${kw} — ${text}`
}

/**
 * Pads or trims text to [minLen, maxLen] while keeping focusKeyword present.
 */
export function fitTextLength(
  base: string,
  focusKeyword: string,
  minLen: number,
  maxLen: number,
  fillers: string[] = []
): string {
  let text = ensureKeywordInText(base.trim(), focusKeyword)

  if (text.length > maxLen) {
    text = trimToMax(text, maxLen)
  }

  const defaultFillers =
    fillers.length > 0
      ? fillers
      : [
          ' Join Kingdom Deliverance Centre Uganda.',
          ' Worship and teaching in Kampala.',
          ' Experience faith, hope, and community.',
        ]

  let fillerIdx = 0
  while (text.length < minLen && fillerIdx < defaultFillers.length) {
    const addition = defaultFillers[fillerIdx++]
    if (text.length + addition.length <= maxLen) {
      text += addition
    } else {
      break
    }
  }

  if (text.length > maxLen) {
    text = trimToMax(text, maxLen)
  }

  if (text.length < minLen) {
    const room = maxLen - text.length
    const pad = ' Learn more.'.repeat(Math.ceil(room / 12)).slice(0, room)
    text += pad
  }

  return text.slice(0, maxLen)
}

export function deriveFocusKeyword(
  keyword: string,
  title: string,
  requested?: string
): string {
  const fromRequest = (requested || '').trim()
  if (fromRequest) {
    return fromRequest.split(/\s+/).slice(0, 4).join(' ')
  }

  const fromAi = keyword.trim()
  if (fromAi) {
    return fromAi.split(/\s+/).slice(0, 4).join(' ')
  }

  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))

  if (words.length >= 2) {
    return words.slice(0, 3).join(' ')
  }
  if (words.length === 1) return words[0]
  return 'kingdom deliverance'
}

export function normalizeSeoTitle(
  title: string,
  focusKeyword: string,
  fallbackTitle: string
): string {
  const base =
    title.trim() ||
    `${focusKeyword} | Kingdom Deliverance Centre Uganda`.trim() ||
    fallbackTitle.trim()

  return fitTextLength(base, focusKeyword, SEO_TITLE_MIN, SEO_TITLE_MAX, [
    ' | Kingdom Deliverance Centre Uganda.',
    ' — Kampala & Global Ministry.',
    ' — Worship, Teaching, Community.',
  ])
}

export function normalizeMetaDescription(
  description: string,
  focusKeyword: string,
  excerpt: string,
  title: string
): string {
  const base =
    description.trim() ||
    excerpt.trim() ||
    `Discover ${focusKeyword} at Kingdom Deliverance Centre Uganda. Join worship, teaching, and community in Kampala and online for ${title}.`.trim()

  return fitTextLength(base, focusKeyword, META_DESC_MIN, META_DESC_MAX, [
    ' Join us in Kampala or online.',
    ' All are welcome.',
    ' Experience faith today.',
  ])
}

export function normalizeSeoSlug(
  slug: string,
  focusKeyword: string,
  title: string
): string {
  const kwSlug = generateSlug(focusKeyword)
  let s = slug.trim().replace(/^\/+/, '') || generateSlug(title)
  if (kwSlug && !s.includes(kwSlug)) {
    s = `${kwSlug}-${s}`.replace(/-+/g, '-').replace(/^-+|-+$/g, '')
  }
  return s.slice(0, 100)
}

const CONTENT_EXPANSION = (focusKeyword: string) => [
  `<p>At Kingdom Deliverance Centre Uganda, <strong>${focusKeyword}</strong> is more than a theme — it is an invitation to worship, grow, and serve together in Kampala and across the nations. We welcome you to encounter God's presence through Spirit-led teaching, vibrant praise, and practical discipleship that strengthens families and communities.</p>`,
  `<p>Whether you join us in person or online, you will find a warm church family committed to the Gospel of Jesus Christ. Our ministry reaches Uganda and the world with hope, healing, and holy living rooted in Scripture and the power of the Holy Spirit.</p>`,
  `<p>As you explore ${focusKeyword} with us, expect clear Biblical teaching, heartfelt worship, and opportunities to pray, give, and build lasting relationships. We believe God is calling every heart to walk in freedom, purpose, and love.</p>`,
  `<p>${focusKeyword} continues to shape our vision as we reach Kampala and the nations. Come as you are — leave transformed by the love of Christ and equipped to share His message with others.</p>`,
]

export function ensureKeywordInIntro(html: string, focusKeyword: string): string {
  const kw = focusKeyword.trim()
  if (!kw) return html
  if (html.slice(0, INTRO_CHAR_LIMIT).toLowerCase().includes(kw.toLowerCase())) {
    return html
  }
  return `<p><strong>${kw}</strong> — ${kw} is at the heart of this message for our church family in Uganda and worldwide.</p>\n${html}`
}

export function normalizeContentHtml(html: string, focusKeyword: string): string {
  let out = html.trim()
  if (!out) {
    out = `<p>${focusKeyword} — welcome to Kingdom Deliverance Centre Uganda.</p>`
  }

  out = ensureKeywordInIntro(out, focusKeyword)

  const expansions = CONTENT_EXPANSION(focusKeyword)
  let expansionIdx = 0
  while (wordCountFromHtml(out) < MIN_CONTENT_WORDS && expansionIdx < expansions.length * 3) {
    out += `\n${expansions[expansionIdx % expansions.length]}`
    expansionIdx++
  }

  out = ensureKeywordInIntro(out, focusKeyword)
  return out
}

export interface NormalizeAiSeoContext {
  title: string
  requestedKeyword?: string
}

/**
 * Post-processes Gemini output so it passes the admin SEO checklist
 * (title/meta lengths, keyword placement, slug, word count).
 */
export function normalizeAiSeoOutput(
  raw: AiGenerateResult,
  context: NormalizeAiSeoContext
): AiGenerateResult {
  const focusKeyword = deriveFocusKeyword(
    raw.focusKeyword || '',
    context.title,
    context.requestedKeyword
  )

  const seoTitle = normalizeSeoTitle(
    raw.seoTitle || '',
    focusKeyword,
    context.title
  )
  const metaDescription = normalizeMetaDescription(
    raw.metaDescription || '',
    focusKeyword,
    raw.excerpt || '',
    context.title
  )
  const slug = normalizeSeoSlug(raw.slug || '', focusKeyword, context.title)
  const html = normalizeContentHtml(raw.html || '', focusKeyword)

  let excerpt = raw.excerpt?.trim() || ''
  if (!excerpt) {
    excerpt = trimToMax(stripHtml(html), 150)
  }
  if (excerpt.length > 150) {
    excerpt = trimToMax(excerpt, 150)
  }

  const normalized: AiGenerateResult = {
    ...raw,
    focusKeyword,
    seoTitle,
    metaDescription,
    slug,
    html,
    excerpt,
  }

  const { score } = computeSeoScore({
    focusKeyword,
    seoTitle,
    metaDescription,
    content: html,
    slug,
    featuredImage: '',
  })

  if (process.env.NODE_ENV === 'development' && score < 90) {
    console.warn('[normalizeAiSeoOutput] SEO score after normalization:', score, {
      titleLen: seoTitle.length,
      metaLen: metaDescription.length,
      words: wordCountFromHtml(html),
    })
  }

  return normalized
}
