const SITE_ORIGIN = 'https://kdcuganda.org'

export type PublicContentKind =
  | 'post'
  | 'sermon'
  | 'event'
  | 'ministry'
  | 'product'

export function buildPublicContentUrl(
  kind: PublicContentKind,
  slug: string
): string {
  const paths: Record<PublicContentKind, string> = {
    post: `/blog/${slug}`,
    sermon: `/sermons/${slug}`,
    event: `/events/${slug}`,
    ministry: `/ministries/${slug}`,
    product: `/shop/${slug}`,
  }
  return `${SITE_ORIGIN}${paths[kind]}`
}
