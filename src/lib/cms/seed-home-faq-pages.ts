import type { CmsPageContent } from '@/lib/cms/page-content'
import { defaultFaqDetails, DEFAULT_FAQ_HERO_IMAGE } from '@/lib/cms/faq-page-defaults'
import { defaultHomeDetails } from '@/lib/cms/home-page-defaults'

/** Full CMS payload for the Homepage system page (matches current live site copy). */
export function getHomeSystemPageContent(): CmsPageContent {
  return {
    pageType: 'home',
    isSystem: true,
    hero: {
      badge: 'Kingdom Deliverance Centre Uganda',
      title: 'Welcome to Kingdom Deliverance Centre',
      subtitle:
        'A place of worship, deliverance, and community in Kampala — join us for Sunday, Wednesday, and Friday services.',
    },
    excerpt: 'Main landing page for KDC Uganda.',
    home: defaultHomeDetails(),
    seo: {
      metaTitle: 'Home | Kingdom Deliverance Centre Uganda',
      metaDescription:
        'Welcome to Kingdom Deliverance Centre Uganda. Join worship, sermons, events, and ministries.',
      focusKeyword: 'Kingdom Deliverance Centre Uganda',
    },
  }
}

/** Full CMS payload for the FAQ system page (matches current live FAQ page). */
export function getFaqSystemPageContent(): CmsPageContent {
  return {
    pageType: 'faq',
    isSystem: true,
    hero: {
      title: 'Frequently Asked Questions',
      subtitle:
        'Quick answers about services, giving, support, and using the KDC Uganda website.',
      imageUrl: DEFAULT_FAQ_HERO_IMAGE,
    },
    excerpt: 'Frequently asked questions and quick visitor answers.',
    faq: defaultFaqDetails(),
    seo: {
      metaTitle: 'FAQ | Kingdom Deliverance Centre Uganda',
      metaDescription:
        'Frequently asked questions about Kingdom Deliverance Centre Uganda services, giving, support, and website access.',
    },
  }
}
