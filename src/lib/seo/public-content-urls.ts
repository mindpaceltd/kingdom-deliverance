/** Production domain for SEO, sitemaps, and Search Console. */
export const CANONICAL_SITE_ORIGIN = 'https://kdcuganda.org'

function normalizeOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/$/, '')
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return `https://${trimmed}`
}

function isCanonicalPublicOrigin(origin: string): boolean {
  try {
    const url = new URL(normalizeOrigin(origin))
    const host = url.hostname.toLowerCase()
    if (/\.vercel\.app$/i.test(host)) return false
    if (host === 'localhost' || host.endsWith('.localhost')) return false
    if (/^127\.\d+\.\d+\.\d+$/.test(host)) return false
    if (host === '0.0.0.0') return false
    return true
  } catch {
    return false
  }
}

function readCanonicalOriginFromEnv(): string | null {
  const keys = ['CANONICAL_SITE_URL', 'NEXT_PUBLIC_SITE_URL', 'SITE_URL'] as const
  for (const key of keys) {
    const raw = process.env[key]?.trim()
    if (!raw) continue
    const origin = normalizeOrigin(raw)
    if (isCanonicalPublicOrigin(origin)) return origin
  }
  return null
}

/** Public site origin for links and metadata (skips Vercel preview / localhost env values). */
export function getDefaultPublicOrigin(): string {
  return readCanonicalOriginFromEnv() ?? CANONICAL_SITE_ORIGIN
}

/**
 * Origin used in sitemap.xml — always the production domain so Search Console accepts URLs.
 * Never uses *.vercel.app even when NEXT_PUBLIC_SITE_URL points at a preview deployment.
 */
export function getSitemapOrigin(): string {
  return CANONICAL_SITE_ORIGIN
}

/** Map Search Console property URL to canonical site origin for indexing. */
export function siteUrlToOrigin(siteUrl: string): string {
  const trimmed = siteUrl.trim()
  if (trimmed.startsWith('sc-domain:')) {
    const domain = trimmed.slice('sc-domain:'.length).replace(/^\/+/, '')
    return `https://${domain}`
  }
  try {
    const withProto = trimmed.includes('://') ? trimmed : `https://${trimmed}`
    return new URL(withProto.endsWith('/') ? withProto : `${withProto}/`).origin
  } catch {
    return getDefaultPublicOrigin()
  }
}

/** Rewrite URL path onto the verified Search Console origin (host must match property). */
export function alignUrlToSiteOrigin(url: string, origin: string): string {
  const parsed = new URL(url)
  const base = origin.replace(/\/$/, '')
  return `${base}${parsed.pathname}${parsed.search}${parsed.hash}`
}

export type PublicContentKind =
  | 'post'
  | 'sermon'
  | 'event'
  | 'ministry'
  | 'product'

/** Public URL for a CMS-managed static page (home → site root). */
export function buildPublicPageUrl(slug: string, origin?: string): string {
  const base = (origin ?? getDefaultPublicOrigin()).replace(/\/$/, '')
  const normalized = slug.trim().toLowerCase()
  if (!normalized || normalized === 'home' || normalized === '/') {
    return `${base}/`
  }
  return `${base}/${normalized.replace(/^\/+/, '')}`
}

export function buildPublicContentUrl(
  kind: PublicContentKind,
  slug: string,
  origin?: string
): string {
  const paths: Record<PublicContentKind, string> = {
    post: `/blog/${slug}`,
    sermon: `/sermons/${slug}`,
    event: `/events/${slug}`,
    ministry: `/ministries/${slug}`,
    product: `/shop/${slug}`,
  }
  const base = (origin ?? getDefaultPublicOrigin()).replace(/\/$/, '')
  return `${base}${paths[kind]}`
}
