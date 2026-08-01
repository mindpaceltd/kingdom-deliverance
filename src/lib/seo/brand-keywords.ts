/**
 * Central SEO keyword registry for KDC Uganda.
 * Import here instead of scattering brand terms across pages.
 */

/** JSON-LD alternateName values (Organization / WebSite). */
export const BRAND_ALTERNATE_NAMES = [
  'KDC',
  'KDC Uganda',
  'Kingdom Deliverance Centre',
  'Kingdom Deliverance Center',
  'Kingdom Deliverance Centre Uganda',
  'Kingdom Deliverance Center Uganda',
  'Kingdom Deliverance Centre Kampala',
  'Kosovo Lungujja Church',
  'Kosovo Church Kampala',
  'Kampala Pentecostal Church',
] as const

const BRAND = [
  'KDC',
  'KDC Uganda',
  'Kingdom Deliverance Centre',
  'Kingdom Deliverance Center',
  'Kingdom Deliverance Centre Uganda',
  'Kingdom Deliverance Center Uganda',
]

const LOCATION = [
  'Kampala church',
  'church in Kampala',
  'church Uganda',
  'Uganda church',
  'Kosovo church',
  'Kosovo Lungujja church',
  'Christian church Kosovo Lungujja',
  'Pentecostal church Uganda',
  'Pentecostal church Kampala',
]

const LEADERSHIP = ['Bishop Climate Wiseman', 'Bishop Climate', 'Bishop Climate Irungu']

const FIRE_SERVICE = [
  'Fire Service',
  'Fire Service Kampala',
  'Fire Service Uganda',
  'KDC Fire Service',
  'Fire Service prayer',
  'Fire Service prayer night',
  'deliverance service Kampala',
]

const MINISTRY = [
  'deliverance ministry Uganda',
  'healing church Kampala',
  'deliverance church Kampala',
  'prayer ministry Kampala',
  'worship Kampala',
  'Bible study Uganda',
  'live church service Uganda',
  'church live stream Uganda',
]

/** Site-wide default meta keywords (root layout + admin seed). */
export const SITE_KEYWORDS = dedupe([
  ...BRAND,
  ...LOCATION,
  ...LEADERSHIP,
  ...FIRE_SERVICE,
  ...MINISTRY,
  'Sunday service Kampala',
  'KDC sermons',
  'Kingdom Temple Uganda',
])

export function siteKeywordsString(): string {
  return SITE_KEYWORDS.join(', ')
}

/** Per-page keyword sets — merged with core brand terms at render time. */
export const PAGE_KEYWORDS = {
  home: [
    'KDC home',
    'Kingdom Deliverance Centre Kampala',
    'Pentecostal church near Kosovo Lungujja',
    'Sunday worship Kampala',
    'Bishop Climate church',
  ],
  about: [
    'about KDC Uganda',
    'Kingdom Deliverance Centre history',
    'Bishop Climate Wiseman ministry',
    'Kampala Pentecostal church about',
  ],
  contact: [
    'KDC contact',
    'Kingdom Deliverance Centre address',
    'Kosovo Lungujja church directions',
    'Kampala church phone number',
  ],
  faq: [
    'KDC FAQ',
    'Kingdom Deliverance Centre service times',
    'Kampala church questions',
    'Fire Service schedule',
  ],
  sermons: [
    'KDC sermons',
    'Bishop Climate Wiseman sermons',
    'church sermons Uganda',
    'deliverance messages Kampala',
    'Christian preaching Uganda',
    'Kingdom Deliverance Centre sermons',
  ],
  live: [
    'KDC live stream',
    'Kingdom Deliverance Centre live',
    'Bishop Climate live',
    'Sunday service live Kampala',
    'YouTube church Uganda',
    'KDC YouTube live',
  ],
  fireService: [
    'KDC Fire Service',
    'Kingdom Deliverance Centre Fire Service',
    'Fire List prayer',
    'monthly prayer night Kampala',
    'deliverance prayer Uganda',
  ],
  events: [
    'KDC events',
    'church events Kampala',
    'Christian conferences Uganda',
    'Fire Service Kampala',
    'church outreach Uganda',
    'Kingdom Deliverance Centre events',
  ],
  ministries: [
    'KDC ministries',
    'church ministries Kampala',
    'youth ministry Uganda',
    'worship ministry Uganda',
    'prayer ministry Kampala',
    'deliverance ministry KDC',
  ],
  blog: [
    'KDC blog',
    'Kingdom Deliverance Centre news',
    'Christian teachings Uganda',
    'church news Kampala',
    'Bishop Climate teachings',
    'faith blog Uganda',
  ],
  shop: [
    'KDC shop',
    'Kingdom Deliverance Centre shop',
    'Christian books Uganda',
    'church merchandise Kampala',
  ],
  gallery: [
    'KDC photos',
    'Kingdom Deliverance Centre gallery',
    'church gallery Kampala',
    'worship photos Uganda',
  ],
  testimonies: [
    'KDC testimonies',
    'church testimonies Uganda',
    'healing testimonies Kampala',
    'deliverance testimonies KDC',
    'Kingdom Deliverance Centre testimonies',
  ],
  give: [
    'give KDC Uganda',
    'Kingdom Deliverance Centre giving',
    'church donations Uganda',
    'tithe Kampala church',
    'support ministry Uganda',
  ],
  donations: [
    'donate KDC Uganda',
    'Kingdom Deliverance Centre donations',
    'online giving Kampala church',
    'tithe Uganda',
    'church offering online',
  ],
  prayer: [
    'KDC prayer request',
    'Kingdom Deliverance Centre prayer',
    'prayer request Kampala church',
    'online prayer Uganda',
  ],
  search: ['KDC search', 'Kingdom Deliverance Centre search'],
} as const satisfies Record<string, readonly string[]>

export type PageKeywordKey = keyof typeof PAGE_KEYWORDS

function dedupe(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const key = item.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item.trim())
  }
  return out
}

/** Comma-separated keywords for a page, always including core brand + location terms. */
export function pageKeywords(page: PageKeywordKey, extra: string[] = []): string {
  return dedupe([...BRAND.slice(0, 4), ...LOCATION.slice(0, 3), ...PAGE_KEYWORDS[page], ...extra]).join(
    ', '
  )
}
