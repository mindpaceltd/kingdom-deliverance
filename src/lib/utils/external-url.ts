/** Ensure social / external hrefs are absolute so Next.js does not treat them as in-app routes. */
export function normalizeExternalHref(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed || trimmed === '#') return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return `https://${trimmed.replace(/^\/+/, '')}`
}
