export type CmsPageType =
  | 'home'
  | 'faq'
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

/** About page sections (managed under Pages → About Us). */
export interface CmsAboutFoundationCard {
  label: string
  text: string
}

export interface CmsAboutLeader {
  name: string
  title: string
  bio: string
  imageUrl?: string
}

export interface CmsAboutTimelineItem {
  year: string
  event: string
}

export interface CmsAboutDetails {
  foundationBadge?: string
  foundationTitle?: string
  foundationCards?: CmsAboutFoundationCard[]
  leadershipBadge?: string
  leadershipTitle?: string
  leaders?: CmsAboutLeader[]
  timelineBadge?: string
  timelineTitle?: string
  timeline?: CmsAboutTimelineItem[]
  affiliationBadge?: string
  affiliationTitle?: string
  affiliationText?: string
}

/** Contact page sidebar, map, and form copy (managed under Pages → Contact). */
export interface CmsContactDetails {
  findUsTitle?: string
  address?: string
  primaryPhone?: string
  additionalPhones?: string[]
  email?: string
  serviceTimes?: string
  mapEmbedUrl?: string
  mapLinkUrl?: string
  mapLinkLabel?: string
  formTitle?: string
  formSuccessTitle?: string
  formSuccessMessage?: string
  submitButtonLabel?: string
}

export interface CmsHomeStat {
  value: string
  label: string
}

export interface CmsHomeFeature {
  title: string
  description: string
  link: string
  linkText: string
}

export interface CmsHomeValueCard {
  title: string
  description: string
}

export interface CmsServiceSlot {
  label: string
  time: string
}

export interface CmsHomeDetails {
  heroWelcomeText?: string
  heroHeadingTop?: string
  heroHeadingBottom?: string
  heroLead?: string
  heroPrimaryCtaLabel?: string
  heroPrimaryCtaUrl?: string
  heroSecondaryCtaLabel?: string
  heroSecondaryCtaUrl?: string
  joinUsLabel?: string
  serviceSlots?: CmsServiceSlot[]
  missionBadge?: string
  missionTitle?: string
  missionBody?: string
  stats?: CmsHomeStat[]
  growTitle?: string
  growSubtitle?: string
  features?: CmsHomeFeature[]
  storeBadge?: string
  storeTitle?: string
  storeSubtitle?: string
  storeViewAllLabel?: string
  storeViewAllUrl?: string
  sermonBadge?: string
  sermonTitle?: string
  sermonSubtitle?: string
  sermonViewAllLabel?: string
  sermonViewAllUrl?: string
  sermonFeaturedBadge?: string
  sermonWatchLabel?: string
  /** Override which published sermon appears (slug). Empty = latest published. */
  sermonFeaturedSlug?: string
  /** Optional thumbnail behind the play button (falls back to sermon thumbnail). */
  sermonThumbnailUrl?: string
  /** Optional direct video/watch URL when clicking the thumbnail or play button. */
  sermonVideoUrl?: string
  valuesBadge?: string
  valuesTitle?: string
  valuesSubtitle?: string
  values?: CmsHomeValueCard[]
  eventsBadge?: string
  eventsTitle?: string
  eventsViewAllLabel?: string
  eventsViewAllUrl?: string
  postsBadge?: string
  postsTitle?: string
  postsViewAllLabel?: string
  postsViewAllUrl?: string
  testimoniesBadge?: string
  testimoniesTitle?: string
  testimoniesSubtitle?: string
  testimoniesCtaTitle?: string
  testimoniesCtaBody?: string
  testimoniesCtaLabel?: string
  testimoniesCtaUrl?: string
  fireCtaTitle?: string
  fireCtaBody?: string
  fireCtaLabel?: string
  fireCtaUrl?: string
}

export interface CmsFaqItem {
  question: string
  answer: string
}

export interface CmsFaqSection {
  title: string
  items: CmsFaqItem[]
}

export interface CmsFaqDetails {
  intro?: string
  lastUpdated?: string
  lastUpdatedLabel?: string
  sections?: CmsFaqSection[]
  helpTitle?: string
  helpMessageLead?: string
  helpLinkLabel?: string
  helpLinkUrl?: string
  helpMessageTail?: string
  /** @deprecated Use helpTitle + helpMessage* fields */
  helpText?: string
}

export interface CmsPageSeo {
  metaTitle?: string
  metaDescription?: string
  focusKeyword?: string
  /** Open Graph title (defaults to meta title on front-end) */
  ogTitle?: string
  ogDescription?: string
  /** 1200×630 recommended — separate from hero background */
  ogImageUrl?: string
  /** Override canonical URL; empty = default public path */
  canonicalUrl?: string
  /** When true, ask search engines not to index this page */
  noIndex?: boolean
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
  home?: CmsHomeDetails
  faq?: CmsFaqDetails
  about?: CmsAboutDetails
  contact?: CmsContactDetails
  /** Optional rich text above the contact grid */
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
    seo: parsePageSeo(o.seo),
    missionTitle: typeof o.missionTitle === 'string' ? o.missionTitle : undefined,
    missionHtml: typeof o.missionHtml === 'string' ? o.missionHtml : undefined,
    home: parseHomeDetails(o.home),
    faq: parseFaqDetails(o.faq),
    about: parseAboutDetails(o.about),
    contact: parseContactDetails(o.contact),
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

function parseHomeDetails(raw: unknown): CmsHomeDetails | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const h = raw as Record<string, unknown>
  const details: CmsHomeDetails = {}
  const strings = [
    'heroWelcomeText',
    'heroHeadingTop',
    'heroHeadingBottom',
    'heroLead',
    'heroPrimaryCtaLabel',
    'heroPrimaryCtaUrl',
    'heroSecondaryCtaLabel',
    'heroSecondaryCtaUrl',
    'joinUsLabel',
    'missionBadge',
    'missionTitle',
    'missionBody',
    'growTitle',
    'growSubtitle',
    'storeBadge',
    'storeTitle',
    'storeSubtitle',
    'storeViewAllLabel',
    'storeViewAllUrl',
    'sermonBadge',
    'sermonTitle',
    'sermonSubtitle',
    'sermonViewAllLabel',
    'sermonViewAllUrl',
    'sermonFeaturedBadge',
    'sermonWatchLabel',
    'sermonFeaturedSlug',
    'sermonThumbnailUrl',
    'sermonVideoUrl',
    'valuesBadge',
    'valuesTitle',
    'valuesSubtitle',
    'eventsBadge',
    'eventsTitle',
    'eventsViewAllLabel',
    'eventsViewAllUrl',
    'postsBadge',
    'postsTitle',
    'postsViewAllLabel',
    'postsViewAllUrl',
    'testimoniesBadge',
    'testimoniesTitle',
    'testimoniesSubtitle',
    'testimoniesCtaTitle',
    'testimoniesCtaBody',
    'testimoniesCtaLabel',
    'testimoniesCtaUrl',
    'fireCtaTitle',
    'fireCtaBody',
    'fireCtaLabel',
    'fireCtaUrl',
  ] as const
  for (const key of strings) {
    if (typeof h[key] === 'string') details[key] = h[key]
  }
  if (Array.isArray(h.serviceSlots)) {
    details.serviceSlots = h.serviceSlots
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'))
      .map((slot) => ({
        label: String(slot.label ?? ''),
        time: String(slot.time ?? ''),
      }))
      .filter((slot) => slot.label.trim() || slot.time.trim())
  }
  if (Array.isArray(h.stats)) {
    details.stats = h.stats
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'))
      .map((stat) => ({
        value: String(stat.value ?? ''),
        label: String(stat.label ?? ''),
      }))
      .filter((stat) => stat.value.trim() || stat.label.trim())
  }
  if (Array.isArray(h.features)) {
    details.features = h.features
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'))
      .map((feature) => ({
        title: String(feature.title ?? ''),
        description: String(feature.description ?? ''),
        link: String(feature.link ?? ''),
        linkText: String(feature.linkText ?? ''),
      }))
      .filter((feature) => feature.title.trim())
  }
  if (Array.isArray(h.values)) {
    details.values = h.values
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'))
      .map((value) => ({
        title: String(value.title ?? ''),
        description: String(value.description ?? ''),
      }))
      .filter((value) => value.title.trim())
  }
  return Object.keys(details).length > 0 ? details : undefined
}

function parseFaqDetails(raw: unknown): CmsFaqDetails | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const f = raw as Record<string, unknown>
  const details: CmsFaqDetails = {}
  const strings = [
    'intro',
    'lastUpdated',
    'lastUpdatedLabel',
    'helpTitle',
    'helpMessageLead',
    'helpLinkLabel',
    'helpLinkUrl',
    'helpMessageTail',
    'helpText',
  ] as const
  for (const key of strings) {
    if (typeof f[key] === 'string') details[key] = f[key]
  }
  if (Array.isArray(f.sections)) {
    details.sections = f.sections
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'))
      .map((section) => ({
        title: String(section.title ?? ''),
        items: Array.isArray(section.items)
          ? section.items
              .filter((it): it is Record<string, unknown> => Boolean(it && typeof it === 'object'))
              .map((item) => ({
                question: String(item.question ?? ''),
                answer: String(item.answer ?? ''),
              }))
              .filter((item) => item.question.trim())
          : [],
      }))
      .filter((section) => section.title.trim())
  }
  return Object.keys(details).length > 0 ? details : undefined
}

function parseAboutDetails(raw: unknown): CmsAboutDetails | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const a = raw as Record<string, unknown>
  const details: CmsAboutDetails = {}
  const strings = [
    'foundationBadge',
    'foundationTitle',
    'leadershipBadge',
    'leadershipTitle',
    'timelineBadge',
    'timelineTitle',
    'affiliationBadge',
    'affiliationTitle',
    'affiliationText',
  ] as const
  for (const key of strings) {
    if (typeof a[key] === 'string') details[key] = a[key]
  }
  if (Array.isArray(a.foundationCards)) {
    details.foundationCards = a.foundationCards
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'))
      .map((c) => ({
        label: String(c.label ?? ''),
        text: String(c.text ?? ''),
      }))
      .filter((c) => c.label.trim() || c.text.trim())
  }
  if (Array.isArray(a.leaders)) {
    details.leaders = a.leaders
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'))
      .map((l) => ({
        name: String(l.name ?? ''),
        title: String(l.title ?? ''),
        bio: String(l.bio ?? ''),
        imageUrl: typeof l.imageUrl === 'string' ? l.imageUrl : undefined,
      }))
      .filter((l) => l.name.trim())
  }
  if (Array.isArray(a.timeline)) {
    details.timeline = a.timeline
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'))
      .map((t) => ({
        year: String(t.year ?? ''),
        event: String(t.event ?? ''),
      }))
      .filter((t) => t.year.trim() || t.event.trim())
  }
  return Object.keys(details).length > 0 ? details : undefined
}

function parseContactDetails(raw: unknown): CmsContactDetails | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const c = raw as Record<string, unknown>
  const details: CmsContactDetails = {}
  const strings = [
    'findUsTitle',
    'address',
    'primaryPhone',
    'email',
    'serviceTimes',
    'mapEmbedUrl',
    'mapLinkUrl',
    'mapLinkLabel',
    'formTitle',
    'formSuccessTitle',
    'formSuccessMessage',
    'submitButtonLabel',
  ] as const
  for (const key of strings) {
    if (typeof c[key] === 'string') details[key] = c[key]
  }
  if (Array.isArray(c.additionalPhones)) {
    details.additionalPhones = c.additionalPhones.filter(
      (x): x is string => typeof x === 'string'
    )
  }
  return Object.keys(details).length > 0 ? details : undefined
}

function parsePageSeo(raw: unknown): CmsPageSeo | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const s = raw as Record<string, unknown>
  const seo: CmsPageSeo = {}
  if (typeof s.metaTitle === 'string') seo.metaTitle = s.metaTitle
  if (typeof s.metaDescription === 'string') seo.metaDescription = s.metaDescription
  if (typeof s.focusKeyword === 'string') seo.focusKeyword = s.focusKeyword
  if (typeof s.ogTitle === 'string') seo.ogTitle = s.ogTitle
  if (typeof s.ogDescription === 'string') seo.ogDescription = s.ogDescription
  if (typeof s.ogImageUrl === 'string') seo.ogImageUrl = s.ogImageUrl
  if (typeof s.canonicalUrl === 'string') seo.canonicalUrl = s.canonicalUrl
  if (typeof s.noIndex === 'boolean') seo.noIndex = s.noIndex
  return Object.keys(seo).length > 0 ? seo : undefined
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
    faq: 'FAQ',
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
