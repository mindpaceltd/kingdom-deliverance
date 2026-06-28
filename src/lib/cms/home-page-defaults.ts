import type { CmsHomeDetails } from '@/lib/cms/page-content'
import { CHURCH_SERVICE_SLOTS } from '@/lib/church-service-times'

const DEFAULT_HOME_DETAILS: CmsHomeDetails = {
  heroWelcomeText: 'Welcome to Kingdom Deliverance Centre Uganda',
  heroHeadingTop: 'Encounter God,',
  heroHeadingBottom: 'Experience Deliverance.',
  heroLead:
    'Join us this Sunday as we worship together, grow in faith, and experience the transformative power of the Holy Spirit in our lives.',
  heroPrimaryCtaLabel: 'Plan a Visit',
  heroPrimaryCtaUrl: '/about',
  heroSecondaryCtaLabel: 'Watch Live',
  heroSecondaryCtaUrl: '/live',
  joinUsLabel: 'Join Us This Week',
  serviceSlots: CHURCH_SERVICE_SLOTS.map((slot) => ({ ...slot })),
  missionBadge: 'Our Mission',
  missionTitle: 'To Set the Captives Free',
  missionBody:
    'Kingdom Deliverance Centre Uganda, led by Bishop Climate Wiseman Irungu and Pastor Clear, is a vibrant community dedicated to the total liberation of mankind. Our mandate is to deliver the oppressed and cultivate a community that is wealthy, healthy, and wise.',
  stats: [
    { value: '500+', label: 'Church Members' },
    { value: '15+', label: 'Years of Ministry' },
    { value: '50+', label: 'Lives Transformed' },
    { value: '10+', label: 'Community Programs' },
  ],
  growTitle: 'Grow With Us',
  growSubtitle:
    'Resources and community designed to help you grow in your faith journey.',
  features: [
    {
      title: 'Latest Sermons',
      description:
        'Catch up on recent teachings and be blessed by the Word of God delivered with passion and truth.',
      link: '/sermons',
      linkText: 'Watch Now',
    },
    {
      title: 'Upcoming Events',
      description:
        'Join us for special services, conferences, and community outreaches that transform lives.',
      link: '/events',
      linkText: 'View Calendar',
    },
    {
      title: 'Ministries',
      description:
        'Find your place to serve and grow in our various church ministries for every age and calling.',
      link: '/ministries',
      linkText: 'Explore Ministries',
    },
    {
      title: 'Give Online',
      description:
        'Partner with us in spreading the Gospel through your generous giving and support the Kingdom work.',
      link: '/donations',
      linkText: 'Donate Now',
    },
  ],
  valuesBadge: 'Our Values',
  valuesTitle: 'What We Stand For',
  valuesSubtitle:
    'Our core values guide everything we do as a church community.',
  values: [
    {
      title: 'Wealthy',
      description:
        "We believe in God's provision and financial breakthrough for His people, enabling us to be a blessing to others.",
    },
    {
      title: 'Healthy',
      description:
        "God's desire is for His children to walk in total health — spirit, soul, and body, free from all infirmities.",
    },
    {
      title: 'Wise',
      description:
        'Through the Word of God, we gain the wisdom needed to navigate life and build lasting generations.',
    },
  ],
  storeBadge: 'KDC Store',
  storeTitle: 'Featured Products',
  storeSubtitle: 'Discover resources to enrich your spiritual journey',
  storeViewAllLabel: 'View All Products',
  storeViewAllUrl: '/shop',
  sermonBadge: 'Latest Message',
  sermonTitle: 'Recent Message',
  sermonSubtitle: 'The latest word from our leadership.',
  sermonViewAllLabel: 'View All Sermons',
  sermonViewAllUrl: '/sermons',
  sermonFeaturedBadge: 'Featured Sermon',
  sermonWatchLabel: 'Watch Full Message',
  sermonThumbnailUrl: '',
  sermonVideoUrl: '',
  sermonFeaturedSlug: '',
  eventsBadge: 'Upcoming Events',
  eventsTitle: "What's Coming Up",
  eventsViewAllLabel: 'View All Events',
  eventsViewAllUrl: '/events',
  postsBadge: 'Latest Posts',
  postsTitle: 'News & Teachings',
  postsViewAllLabel: 'Read All Posts',
  postsViewAllUrl: '/blog',
  testimoniesBadge: 'Testimonies',
  testimoniesTitle: 'Lives Transformed',
  testimoniesSubtitle:
    'Read what God is doing in the lives of our church family at Kingdom Deliverance Centre Uganda.',
  testimoniesCtaTitle: 'Have a testimony?',
  testimoniesCtaBody: 'Share what God has done in your life to encourage others.',
  testimoniesCtaLabel: 'Submit Your Testimony',
  testimoniesCtaUrl: '/testimonies',
  fireCtaTitle: '🔥 The Fire Service 🔥',
  fireCtaBody:
    'There is a matter in your life that will not respond until it is brought into the place of fire. Submit your case to the Fire Altar tonight.',
  fireCtaLabel: 'Submit Your Fire List Now',
  fireCtaUrl: '/fire-service',
}

function pickString(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

export function defaultHomeDetails(): CmsHomeDetails {
  return {
    ...DEFAULT_HOME_DETAILS,
    serviceSlots: DEFAULT_HOME_DETAILS.serviceSlots?.map((slot) => ({ ...slot })),
    stats: DEFAULT_HOME_DETAILS.stats?.map((stat) => ({ ...stat })),
    features: DEFAULT_HOME_DETAILS.features?.map((feature) => ({ ...feature })),
    values: DEFAULT_HOME_DETAILS.values?.map((value) => ({ ...value })),
  }
}

export function resolveHomeDetails(cms?: CmsHomeDetails | null): CmsHomeDetails {
  const defaults = defaultHomeDetails()
  return {
    ...defaults,
    ...cms,
    heroWelcomeText: pickString(cms?.heroWelcomeText, defaults.heroWelcomeText),
    heroHeadingTop: pickString(cms?.heroHeadingTop, defaults.heroHeadingTop),
    heroHeadingBottom: pickString(cms?.heroHeadingBottom, defaults.heroHeadingBottom),
    heroLead: pickString(cms?.heroLead, defaults.heroLead),
    heroPrimaryCtaLabel: pickString(cms?.heroPrimaryCtaLabel, defaults.heroPrimaryCtaLabel),
    heroPrimaryCtaUrl: pickString(cms?.heroPrimaryCtaUrl, defaults.heroPrimaryCtaUrl),
    heroSecondaryCtaLabel: pickString(cms?.heroSecondaryCtaLabel, defaults.heroSecondaryCtaLabel),
    heroSecondaryCtaUrl: pickString(cms?.heroSecondaryCtaUrl, defaults.heroSecondaryCtaUrl),
    joinUsLabel: pickString(cms?.joinUsLabel, defaults.joinUsLabel),
    missionBadge: pickString(cms?.missionBadge, defaults.missionBadge),
    missionTitle: pickString(cms?.missionTitle, defaults.missionTitle),
    missionBody: pickString(cms?.missionBody, defaults.missionBody),
    growTitle: pickString(cms?.growTitle, defaults.growTitle),
    growSubtitle: pickString(cms?.growSubtitle, defaults.growSubtitle),
    storeBadge: pickString(cms?.storeBadge, defaults.storeBadge),
    storeTitle: pickString(cms?.storeTitle, defaults.storeTitle),
    storeSubtitle: pickString(cms?.storeSubtitle, defaults.storeSubtitle),
    storeViewAllLabel: pickString(cms?.storeViewAllLabel, defaults.storeViewAllLabel),
    storeViewAllUrl: pickString(cms?.storeViewAllUrl, defaults.storeViewAllUrl),
    sermonBadge: pickString(cms?.sermonBadge, defaults.sermonBadge),
    sermonTitle: pickString(cms?.sermonTitle, defaults.sermonTitle),
    sermonSubtitle: pickString(cms?.sermonSubtitle, defaults.sermonSubtitle),
    sermonViewAllLabel: pickString(cms?.sermonViewAllLabel, defaults.sermonViewAllLabel),
    sermonViewAllUrl: pickString(cms?.sermonViewAllUrl, defaults.sermonViewAllUrl),
    sermonFeaturedBadge: pickString(cms?.sermonFeaturedBadge, defaults.sermonFeaturedBadge),
    sermonWatchLabel: pickString(cms?.sermonWatchLabel, defaults.sermonWatchLabel),
    sermonFeaturedSlug: pickString(cms?.sermonFeaturedSlug, defaults.sermonFeaturedSlug),
    sermonThumbnailUrl: pickString(cms?.sermonThumbnailUrl, defaults.sermonThumbnailUrl),
    sermonVideoUrl: pickString(cms?.sermonVideoUrl, defaults.sermonVideoUrl),
    valuesBadge: pickString(cms?.valuesBadge, defaults.valuesBadge),
    valuesTitle: pickString(cms?.valuesTitle, defaults.valuesTitle),
    valuesSubtitle: pickString(cms?.valuesSubtitle, defaults.valuesSubtitle),
    eventsBadge: pickString(cms?.eventsBadge, defaults.eventsBadge),
    eventsTitle: pickString(cms?.eventsTitle, defaults.eventsTitle),
    eventsViewAllLabel: pickString(cms?.eventsViewAllLabel, defaults.eventsViewAllLabel),
    eventsViewAllUrl: pickString(cms?.eventsViewAllUrl, defaults.eventsViewAllUrl),
    postsBadge: pickString(cms?.postsBadge, defaults.postsBadge),
    postsTitle: pickString(cms?.postsTitle, defaults.postsTitle),
    postsViewAllLabel: pickString(cms?.postsViewAllLabel, defaults.postsViewAllLabel),
    postsViewAllUrl: pickString(cms?.postsViewAllUrl, defaults.postsViewAllUrl),
    testimoniesBadge: pickString(cms?.testimoniesBadge, defaults.testimoniesBadge),
    testimoniesTitle: pickString(cms?.testimoniesTitle, defaults.testimoniesTitle),
    testimoniesSubtitle: pickString(cms?.testimoniesSubtitle, defaults.testimoniesSubtitle),
    testimoniesCtaTitle: pickString(cms?.testimoniesCtaTitle, defaults.testimoniesCtaTitle),
    testimoniesCtaBody: pickString(cms?.testimoniesCtaBody, defaults.testimoniesCtaBody),
    testimoniesCtaLabel: pickString(cms?.testimoniesCtaLabel, defaults.testimoniesCtaLabel),
    testimoniesCtaUrl: pickString(cms?.testimoniesCtaUrl, defaults.testimoniesCtaUrl),
    fireCtaTitle: pickString(cms?.fireCtaTitle, defaults.fireCtaTitle),
    fireCtaBody: pickString(cms?.fireCtaBody, defaults.fireCtaBody),
    fireCtaLabel: pickString(cms?.fireCtaLabel, defaults.fireCtaLabel),
    fireCtaUrl: pickString(cms?.fireCtaUrl, defaults.fireCtaUrl),
    serviceSlots: cms?.serviceSlots?.length ? cms.serviceSlots : defaults.serviceSlots,
    stats: cms?.stats?.length ? cms.stats : defaults.stats,
    features: cms?.features?.length ? cms.features : defaults.features,
    values: cms?.values?.length ? cms.values : defaults.values,
  }
}
