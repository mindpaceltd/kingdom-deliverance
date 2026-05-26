export function getDefaultPublicOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'https://kdcuganda.org'
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
