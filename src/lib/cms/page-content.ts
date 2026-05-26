export type CmsPageType =
  | 'home'
  | 'about'
  | 'contact'
  | 'give'
  | 'prayer'
  | 'fire_service'
  | 'live'
  | 'testimonies'
  | 'privacy'
  | 'terms'
  | 'listing'
  | 'custom'

export type ListingTarget =
  | 'ministries'
  | 'blog'
  | 'sermons'
  | 'events'
  | 'shop'
  | 'gallery'

export interface CmsPageHero {
  badge?: string
  title: string
  subtitle?: string
  imageUrl?: string
}

export interface CmsPageSeo {
  metaTitle?: string
  metaDescription?: string
  focusKeyword?: string
}

export interface CmsPageContent {
  pageType: CmsPageType
  listingTarget?: ListingTarget
  hero?: CmsPageHero
  excerpt?: string
  bodyHtml?: string
  seo?: CmsPageSeo
  missionTitle?: string
  missionHtml?: string
  contactIntroHtml?: string
  donationIntroHtml?: string
  liveStreamUrl?: string
  ctaLabel?: string
  ctaUrl?: string
  isSystem?: boolean
}

export function parsePageContent(raw: unknown): CmsPageContent {
  if (!raw || typeof raw !== 'object') {
    return { pageType: 'custom', bodyHtml: '' }
  }
  const o = raw as Record<string, unknown>
  const pageType = (o.pageType as CmsPageType) || 'custom'
  return {
    pageType,
    listingTarget: o.listingTarget as ListingTarget | undefined,
    hero: o.hero as CmsPageHero | undefined,
    excerpt: typeof o.excerpt === 'string' ? o.excerpt : undefined,
    bodyHtml: typeof o.bodyHtml === 'string' ? o.bodyHtml : undefined,
    seo: o.seo as CmsPageSeo | undefined,
    missionTitle: typeof o.missionTitle === 'string' ? o.missionTitle : undefined,
    missionHtml: typeof o.missionHtml === 'string' ? o.missionHtml : undefined,
    contactIntroHtml:
      typeof o.contactIntroHtml === 'string' ? o.contactIntroHtml : undefined,
    donationIntroHtml:
      typeof o.donationIntroHtml === 'string' ? o.donationIntroHtml : undefined,
    liveStreamUrl: typeof o.liveStreamUrl === 'string' ? o.liveStreamUrl : undefined,
    ctaLabel: typeof o.ctaLabel === 'string' ? o.ctaLabel : undefined,
    ctaUrl: typeof o.ctaUrl === 'string' ? o.ctaUrl : undefined,
    isSystem: Boolean(o.isSystem),
  }
}

export function buildContentJson(content: CmsPageContent): Record<string, unknown> {
  return { ...content }
}

export function pagePathFromSlug(slug: string): string {
  if (!slug || slug === 'home') return '/'
  return `/${slug}`
}

export function pageTypeLabel(type: CmsPageType, listingTarget?: ListingTarget): string {
  if (type === 'listing' && listingTarget) {
    return `${listingTarget.charAt(0).toUpperCase()}${listingTarget.slice(1)} listing`
  }
  const labels: Record<CmsPageType, string> = {
    home: 'Homepage',
    about: 'About',
    contact: 'Contact',
    give: 'Give / Donate',
    prayer: 'Prayer',
    fire_service: 'Fire Service',
    live: 'Live stream',
    testimonies: 'Testimonies',
    privacy: 'Privacy policy',
    terms: 'Terms',
    listing: 'Listing page',
    custom: 'Custom page',
  }
  return labels[type] ?? 'Page'
}
