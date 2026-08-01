/** Decode common HTML entities so "&amp;" and "&" normalize the same. */
export function decodeHtmlEntities(value: string): string {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
}

/** Normalize product names for duplicate detection. */
export function normalizeProductName(name: string): string {
  return decodeHtmlEntities(name)
    .toLowerCase()
    .replace(/^copy of\s+/i, '')
    .replace(/\s*\(copy\)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normalize sermon titles for duplicate detection. */
export function normalizeSermonTitle(title: string): string {
  return decodeHtmlEntities(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Strip extension and lowercase — used to de-dupe .docx/.pdf pairs in a batch. */
export function normalizeUploadFilename(name: string): string {
  return name.replace(/\.[^.]+$/, '').trim().toLowerCase()
}
