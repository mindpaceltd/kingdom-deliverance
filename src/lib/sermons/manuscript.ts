/**
 * Turns an uploaded sermon manuscript (.docx / .pdf / .txt) into the fields the
 * sermons CMS needs. Everything here is heuristic and works with no AI key, so a
 * bulk import always produces usable records; AI enrichment layers on top.
 */

export interface ParsedManuscript {
  /** Sermon title, taken from the heading or falling back to the filename. */
  title: string
  /** Theme line if the manuscript declares one. */
  theme: string | null
  /** Main scripture reference, e.g. "1 Samuel 9:15–17 KJV". */
  mainScripture: string | null
  /** Short plain-text summary for the sermon description. */
  summary: string
  /** Sermon body as sanitised HTML. */
  html: string
  /** Full plain text, used for AI prompts and reading-time estimates. */
  text: string
  wordCount: number
  /** Rough spoken duration in minutes. */
  estimatedMinutes: number
  /** Date parsed out of the filename or heading, ISO yyyy-mm-dd. */
  detectedDate: string | null
}

const LABEL_PATTERNS: Record<string, RegExp> = {
  title: /^(sermon\s+title|message\s+title|title)\s*[:\-–]?\s*(.*)$/i,
  theme: /^(program\s+theme|main\s+theme|theme|topic|subject)\s*[:\-–]?\s*(.*)$/i,
  scripture:
    /^(?:main\s+|key\s+|bible\s+)?(?:scripture|text|verse)(?:\s+anchor)?\s*[:\-–]?\s*(.*)$/i,
  anchor: /^anchor\s*[:\-–]?\s*(.*)$/i,
}

/** Headings that are structural labels rather than the sermon's actual title. */
const NON_TITLE_LINES =
  /^(sermon\s+title|message\s+title|title|program\s+theme|main\s+theme|theme|topic|subject|sub-?title|main\s+scripture|scripture|scripture\s+anchor|anchor|text|bible\s+text|key\s+verse|purpose|day|date|introduction|opening|outline)\b/i

/** A scripture citation such as "1 Samuel 9:15–17 KJV" or "Matthew 28:1-6". */
const SCRIPTURE_REF =
  /\b((?:[1-3]\s*)?(?:[A-Z][a-z]+\.?)(?:\s+of\s+[A-Z][a-z]+)?\s+\d{1,3}:\d{1,3}(?:\s*[–—-]\s*\d{1,3}(?::\d{1,3})?)?(?:\s+(?:KJV|NKJV|NIV|ESV|NLT|AMP|MSG|ASV|RSV))?)/

/**
 * Programme and service names ("Prophetic Morning Service", "Friday Prayer").
 * These head most manuscripts, but the sermon's real title is the heading after them.
 */
const GENERIC_HEADING =
  /\b(service|prayer\s+(?:and|&)\s+deliverance|broadcast|episode|programme|program|bible\s+study|crusade|conference\s+[–—-]?\s*day|delta\s+tv|radio|kingdom\s+deliverance\s+centre)\b/i

const MONTHS =
  'january|february|march|april|may|june|july|august|september|october|november|december'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function titleCase(value: string): string {
  const small = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into',
    'nor', 'of', 'on', 'or', 'the', 'to', 'up', 'with',
  ])
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && small.has(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/** ALL-CAPS manuscript headings read badly as titles, so normalise them. */
function normaliseHeading(value: string): string {
  const cleaned = value.replace(/\s+/g, ' ').trim().replace(/[:.\s]+$/, '')
  const letters = cleaned.replace(/[^A-Za-z]/g, '')
  if (letters.length > 3 && letters === letters.toUpperCase()) {
    return titleCase(cleaned)
  }
  return cleaned
}

function stripQuotes(value: string): string {
  return value.replace(/^["“”'‘’\s]+|["“”'‘’\s]+$/g, '').trim()
}

function parseDateFrom(value: string): string | null {
  const monthDay = value.match(new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'))
  if (monthDay) {
    const monthIndex = MONTHS.split('|').indexOf(monthDay[1].toLowerCase())
    const day = Number(monthDay[2])
    const yearMatch = value.match(/\b(20\d{2})\b/)
    const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear()
    const d = new Date(Date.UTC(year, monthIndex, day))
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }

  const iso = value.match(/\b(20\d{2})[-_/](\d{1,2})[-_/](\d{1,2})\b/)
  if (iso) {
    const d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])))
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }

  return null
}

/** Turn a filename into a readable fallback title. */
export function titleFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
  return normaliseHeading(stem) || 'Untitled Sermon'
}

/** Long verse quotations make poor summaries, so they are skipped. */
function looksLikeScriptureQuote(line: string): boolean {
  if (/^[“"']/.test(line)) return true
  return SCRIPTURE_REF.test(line) && line.length > 120
}

/**
 * Production run-sheets ("Program Flow: Opening, Prayer, Testimonies") head the
 * broadcast manuscripts. They belong in the body but read badly in a summary.
 */
const BOILERPLATE_LINE =
  /^(program\s+flow|programme\s+flow|running\s+order|run\s+sheet|order\s+of\s+service|flow|duration|host|presenter|producer|station|channel|air\s*time|venue|segment|call[-\s]?in|contacts?)\b\s*[:\-–]/i

function buildSummary(paragraphs: string[], theme: string | null): string {
  // The theme line is the most quotable one-liner when the preacher provides it.
  const parts: string[] = []
  if (theme) parts.push(stripQuotes(theme))

  for (const p of paragraphs) {
    if (parts.join(' ').length > 220) break
    if (p.length < 60) continue
    if (NON_TITLE_LINES.test(p)) continue
    if (BOILERPLATE_LINE.test(p)) continue
    if (looksLikeScriptureQuote(p)) continue
    parts.push(p)
  }

  const summary = parts.join(' ').replace(/\s+/g, ' ').trim()
  if (summary.length <= 300) return summary
  const clipped = summary.slice(0, 300)
  const lastStop = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('! '), clipped.lastIndexOf('? '))
  return (lastStop > 140 ? clipped.slice(0, lastStop + 1) : `${clipped.trimEnd()}…`).trim()
}

/**
 * A line is treated as a heading when it is short, has no terminal punctuation,
 * and is either all-caps or a known label — matching how these manuscripts are written.
 */
function isHeadingLine(line: string): boolean {
  if (line.length > 90) return false
  if (/[.!?,;]$/.test(line)) return false
  const letters = line.replace(/[^A-Za-z]/g, '')
  if (letters.length < 3) return false
  return letters === letters.toUpperCase() || NON_TITLE_LINES.test(line)
}

function paragraphsToHtml(paragraphs: string[]): string {
  return paragraphs
    .map((p) => {
      if (isHeadingLine(p)) {
        return `<h2>${escapeHtml(normaliseHeading(p))}</h2>`
      }
      return `<p>${escapeHtml(p)}</p>`
    })
    .join('\n')
}

/** Split raw extracted text into clean paragraphs. */
function toParagraphs(raw: string): string[] {
  return raw
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map((line) => line.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
}

/** Extract plain text from a manuscript buffer based on its file extension. */
export async function extractManuscriptText(
  buffer: Buffer,
  filename: string
): Promise<{ text: string } | { error: string }> {
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]

  try {
    if (ext === 'docx') {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return { text: result.value }
    }

    if (ext === 'pdf') {
      const { extractText, getDocumentProxy } = await import('unpdf')
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      const { text } = await extractText(pdf, { mergePages: true })
      return { text: Array.isArray(text) ? text.join('\n') : text }
    }

    if (ext === 'txt' || ext === 'md') {
      return { text: buffer.toString('utf8') }
    }

    if (ext === 'doc') {
      return {
        error:
          'Legacy .doc files are not supported. Re-save as .docx (File → Save As → Word Document).',
      }
    }

    return { error: `Unsupported file type ".${ext ?? 'unknown'}". Use .docx, .pdf, or .txt.` }
  } catch (err: any) {
    return { error: `Could not read the file: ${err?.message ?? 'unknown error'}` }
  }
}

/** Parse extracted manuscript text into sermon fields. */
export function parseManuscript(rawText: string, filename: string): ParsedManuscript {
  const paragraphs = toParagraphs(rawText)

  let theme: string | null = null
  let mainScripture: string | null = null
  let declaredTitle: string | null = null
  let title: string | null = null

  // Labels are usually declared in the first page of the manuscript. A label may
  // carry its value inline ("Theme: X") or on the following line.
  const head = paragraphs.slice(0, 30)
  const valueFor = (inline: string, index: number): string | null => {
    const value = stripQuotes(inline)
    if (value) return value
    const next = stripQuotes(head[index + 1] ?? '')
    // Only borrow the next line when it is not itself a label.
    return next && !NON_TITLE_LINES.test(next) ? next : null
  }

  for (let i = 0; i < head.length; i++) {
    const line = head[i]

    const titleMatch = line.match(LABEL_PATTERNS.title)
    if (titleMatch && !declaredTitle) {
      declaredTitle = valueFor(titleMatch[2], i)
      continue
    }

    const themeMatch = line.match(LABEL_PATTERNS.theme)
    if (themeMatch && !theme) {
      const value = valueFor(themeMatch[2], i)
      // A "Main Theme" label is often followed by a full paragraph, not a theme line.
      theme = value && value.length <= 150 ? value : null
      continue
    }

    const scriptureMatch = line.match(LABEL_PATTERNS.scripture) ?? line.match(LABEL_PATTERNS.anchor)
    if (scriptureMatch && !mainScripture) {
      const raw = valueFor(scriptureMatch[1] ?? '', i)
      // Manuscripts often run the reference straight into the quoted verse.
      const candidate = raw ? (raw.match(SCRIPTURE_REF)?.[1] ?? raw).trim().slice(0, 120) : null
      // Reject values with no chapter:verse — "Text" and "Verse" match other things.
      mainScripture = candidate && /\d+:\d+/.test(candidate) ? candidate : null
      continue
    }
  }

  // Any citation in the opening lines beats no citation at all.
  if (!mainScripture) {
    for (const line of head) {
      const found = line.match(SCRIPTURE_REF)
      if (found) {
        mainScripture = found[1].trim()
        break
      }
    }
  }

  // Title priority: an explicit "Sermon Title:" label, then a declared theme,
  // then the first real heading, then the filename.
  if (declaredTitle) {
    title = normaliseHeading(declaredTitle)
  }

  if (!title && theme) {
    const themeTitle = normaliseHeading(theme)
    if (themeTitle.length >= 10 && themeTitle.length <= 120) title = themeTitle
  }

  if (!title) {
    const headings = head.filter(
      (line) =>
        !NON_TITLE_LINES.test(line) &&
        line.length >= 6 &&
        line.length <= 120 &&
        isHeadingLine(line)
    )
    // Skip the programme name so the sermon's own title wins.
    const specific = headings.find((line) => !GENERIC_HEADING.test(line))
    const chosen = specific ?? headings[0]
    if (chosen) title = normaliseHeading(chosen)
  }

  if (!title) title = titleFromFilename(filename)

  const text = paragraphs.join('\n')
  const wordCount = text.split(/\s+/).filter(Boolean).length

  return {
    title,
    theme: theme ? stripQuotes(theme) : null,
    mainScripture,
    summary: buildSummary(paragraphs, theme),
    html: paragraphsToHtml(paragraphs),
    text,
    wordCount,
    // Preaching runs slower than silent reading — roughly 130 words per minute.
    estimatedMinutes: Math.max(1, Math.round(wordCount / 130)),
    detectedDate: parseDateFrom(filename) ?? parseDateFrom(head.join(' ')),
  }
}
