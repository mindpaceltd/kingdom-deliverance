import {
  parsePageContent,
  type CmsAboutDetails,
  type CmsAboutFoundationCard,
  type CmsAboutLeader,
  type CmsAboutTimelineItem,
  type CmsPageHero,
} from '@/lib/cms/page-content'
import { SYSTEM_PAGE_DEFINITIONS } from '@/lib/cms/system-pages'
import { normalizeMediaUrl } from '@/lib/media-url'

const DEFAULT_ABOUT_HERO_URL =
  'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop'

const ABOUT_SYSTEM = SYSTEM_PAGE_DEFINITIONS.find((d) => d.slug === 'about')!

export type {
  CmsAboutDetails,
  CmsAboutFoundationCard,
  CmsAboutLeader,
  CmsAboutTimelineItem,
}

export interface ResolvedAboutPage {
  hero: Required<Pick<CmsPageHero, 'title'>> &
    Pick<CmsPageHero, 'badge' | 'subtitle' | 'imageUrl'>
  foundationBadge: string
  foundationTitle: string
  foundationCards: CmsAboutFoundationCard[]
  leadershipBadge: string
  leadershipTitle: string
  leaders: CmsAboutLeader[]
  timelineBadge: string
  timelineTitle: string
  timeline: CmsAboutTimelineItem[]
  affiliationBadge: string
  affiliationTitle: string
  affiliationText: string
}

const FALLBACK_FOUNDATION: CmsAboutFoundationCard[] = [
  {
    label: 'Our Mission',
    text: 'To set the captives free — bringing salvation, healing, and deliverance to every soul through the power of Jesus Christ.',
  },
  {
    label: 'Our Vision',
    text: 'To cultivate a community that is wealthy, healthy and wise, grounded in the Word of God and empowered for total transformation.',
  },
  {
    label: 'Our Values',
    text: 'Faith, Prayer, Integrity, Community, Excellence in Worship, and unwavering commitment to the authority of Scripture.',
  },
]

const FALLBACK_LEADERS: CmsAboutLeader[] = [
  {
    name: 'Bishop Climate Wiseman Irungu',
    title: 'Senior Pastor & Founder',
    bio: 'Bishop Climate Wiseman Irungu is the visionary leader and founder of Kingdom Deliverance Centre Uganda. With a heart for the people of Uganda, he leads with power and authority to set the captives free. He is also the head of Kingdom Temple network.',
    imageUrl: '/images/bishop.jpg',
  },
  {
    name: 'Pastor Clear',
    title: 'Co-Founder & Kingdom Temple UK',
    bio: 'Pastor Clear brings an anointed word from the UK and co-pioneered the work of Kingdom Deliverance alongside Bishop Climate. Together, they are building a community that is wealthy, healthy, and wise.',
    imageUrl: '/images/pastor-clear.jpg',
  },
  {
    name: 'Pastor Grace Wiseman',
    title: 'Lead Pastor',
    bio: 'An anointed minister and teacher of the Word, Pastor Grace leads the daily operations of the ministry in Uganda, seeing families restored and walking in their God-given destiny.',
    imageUrl: '/images/co-pastor.jpg',
  },
]

const FALLBACK_TIMELINE: CmsAboutTimelineItem[] = [
  {
    year: '2025',
    event:
      'The Uganda branch of Kingdom Deliverance Centre opens in Kampala under Kingdom Temple, led by Bishop Climate Wiseman.',
  },
  {
    year: '2025',
    event:
      'Weekly worship and teaching established — Sunday, Wednesday, and Friday services at the KDC Centre in Kosovo–Lungujja.',
  },
  {
    year: '2026',
    event:
      'Fire Service ministry and the Global Fire Altar expand, reaching families across Kampala and online.',
  },
  {
    year: '2026',
    event:
      'The Uganda branch continues to grow as a community rooted in faith, prayer, and deliverance.',
  },
]

export function defaultAboutDetails(): CmsAboutDetails {
  return {
    foundationBadge: 'Our Foundation',
    foundationTitle: 'Built on Purpose',
    foundationCards: [...FALLBACK_FOUNDATION],
    leadershipBadge: 'Meet The Team',
    leadershipTitle: 'Our Leadership',
    leaders: FALLBACK_LEADERS.map((l) => ({ ...l })),
    timelineBadge: 'In Uganda Since 2025',
    timelineTitle: 'Our Journey',
    timeline: [...FALLBACK_TIMELINE],
    affiliationBadge: 'Our Network',
    affiliationTitle: 'Part of Kingdom Temple',
    affiliationText:
      'Kingdom Deliverance Centre Uganda is proudly affiliated with Kingdom Temple, a global ministry network founded and led by Bishop Climate Wiseman. Kingdom Temple has branches across East Africa and is committed to spreading the Gospel and demonstrating the power of God in every nation.',
    ...(ABOUT_SYSTEM.content.about ?? {}),
  }
}

function pickString(...candidates: (string | undefined)[]): string | undefined {
  for (const value of candidates) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

function normalizeLeaderImage(url?: string): string | undefined {
  if (!url?.trim()) return undefined
  return normalizeMediaUrl(url) ?? url
}

export function resolveAboutPage(
  cmsContent: ReturnType<typeof parsePageContent> | null,
  heroFallbackUrl?: string | null
): ResolvedAboutPage {
  const system = ABOUT_SYSTEM.content
  const base = cmsContent?.pageType === 'about' ? cmsContent : system
  const about: CmsAboutDetails = {
    ...defaultAboutDetails(),
    ...base.about,
  }
  const hero: CmsPageHero = { ...system.hero, ...base.hero }
  const defaults = defaultAboutDetails()

  const leaders = (about.leaders?.length ? about.leaders : defaults.leaders ?? []).map(
    (l) => ({
      ...l,
      imageUrl: normalizeLeaderImage(l.imageUrl),
    })
  )

  return {
    hero: {
      badge: pickString(hero.badge, system.hero?.badge) ?? 'Our Story',
      title: pickString(hero.title, system.hero?.title) ?? 'About Kingdom Deliverance Centre',
      subtitle:
        pickString(hero.subtitle, system.hero?.subtitle) ??
        'A movement of faith, power, and transformation — rooted in the Word of God and led by the Holy Spirit to impact lives across Uganda and beyond.',
      imageUrl:
        pickString(hero.imageUrl, heroFallbackUrl ?? undefined) ?? DEFAULT_ABOUT_HERO_URL,
    },
    foundationBadge:
      pickString(about.foundationBadge, defaults.foundationBadge) ?? 'Our Foundation',
    foundationTitle:
      pickString(about.foundationTitle, defaults.foundationTitle) ?? 'Built on Purpose',
    foundationCards:
      about.foundationCards?.length ? about.foundationCards : (defaults.foundationCards ?? FALLBACK_FOUNDATION),
    leadershipBadge:
      pickString(about.leadershipBadge, defaults.leadershipBadge) ?? 'Meet The Team',
    leadershipTitle:
      pickString(about.leadershipTitle, defaults.leadershipTitle) ?? 'Our Leadership',
    leaders,
    timelineBadge:
      pickString(about.timelineBadge, defaults.timelineBadge) ?? 'In Uganda Since 2025',
    timelineTitle: pickString(about.timelineTitle, defaults.timelineTitle) ?? 'Our Journey',
    timeline: about.timeline?.length ? about.timeline : (defaults.timeline ?? FALLBACK_TIMELINE),
    affiliationBadge:
      pickString(about.affiliationBadge, defaults.affiliationBadge) ?? 'Our Network',
    affiliationTitle:
      pickString(about.affiliationTitle, defaults.affiliationTitle) ?? 'Part of Kingdom Temple',
    affiliationText:
      pickString(about.affiliationText, defaults.affiliationText) ??
      'Kingdom Deliverance Centre Uganda is proudly affiliated with Kingdom Temple.',
  }
}
