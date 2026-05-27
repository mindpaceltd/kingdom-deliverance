import type { CmsPageContent } from '@/lib/cms/page-content'

export interface SystemPageDefinition {
  title: string
  slug: string
  status: 'draft' | 'published'
  content: CmsPageContent
}

/** Built-in front-end routes managed in the CMS (not wired to the site yet). */
export const SYSTEM_PAGE_DEFINITIONS: SystemPageDefinition[] = [
  {
    title: 'Homepage',
    slug: 'home',
    status: 'published',
    content: {
      pageType: 'home',
      isSystem: true,
      hero: {
        badge: 'Kingdom Deliverance Centre Uganda',
        title: 'Welcome to Kingdom Deliverance Centre',
        subtitle:
          'A place of worship, deliverance, and community in Kampala — join us for Sunday, Wednesday, and Friday services.',
      },
      excerpt: 'Main landing page for KDC Uganda.',
      seo: {
        metaTitle: 'Kingdom Deliverance Centre Uganda',
        metaDescription:
          'Join worship, sermons, events, and ministries at Kingdom Deliverance Centre Uganda in Kampala.',
        focusKeyword: 'Kingdom Deliverance Centre Uganda',
      },
    },
  },
  {
    title: 'About Us',
    slug: 'about',
    status: 'published',
    content: {
      pageType: 'about',
      isSystem: true,
      hero: {
        badge: 'Our Story',
        title: 'About Kingdom Deliverance Centre',
        subtitle:
          'Learn our history, vision, and leadership under Bishop Climate Wiseman.',
      },
      missionTitle: 'Our mission',
      missionHtml:
        '<p>Kingdom Deliverance Centre Uganda exists to set captives free through the power of the Gospel, vibrant worship, and Spirit-led teaching.</p>',
      bodyHtml:
        '<p>Share your story, leadership highlights, and what makes KDC unique. This content will appear on the public About page when CMS rendering is enabled.</p>',
      seo: {
        metaTitle: 'About Us | Kingdom Deliverance Centre Uganda',
        metaDescription:
          'Learn about Kingdom Deliverance Centre Uganda — history, vision, leadership, and mission.',
        focusKeyword: 'about KDC Uganda',
      },
    },
  },
  {
    title: 'Contact',
    slug: 'contact',
    status: 'published',
    content: {
      pageType: 'contact',
      isSystem: true,
      hero: {
        badge: 'Get In Touch',
        title: 'Contact Us',
        subtitle:
          'We would love to hear from you. Reach out with any questions, prayer requests, or to learn more about our church.',
      },
      contact: {
        findUsTitle: 'Find Us',
        address: 'Kingdom Deliverance Centre Uganda\nKampala, Uganda',
        primaryPhone: '+256 700 000 000',
        additionalPhones: [],
        email: 'info@kdcuganda.org',
        serviceTimes:
          'Sunday: 10:00 AM (EAT)\nWednesday: 6:00 PM (EAT)\nFriday: 6:00 PM (EAT)',
        mapEmbedUrl:
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7573!2d32.5825!3d0.3136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177dbc0f9d74b39b%3A0x4099d33b10770b2!2sKingdom+Deliverance+Centre+Uganda!5e0!3m2!1sen!2sug!4v1714000000000',
        mapLinkUrl: 'https://maps.app.goo.gl/RrBd8tDxEDky8D6N7',
        mapLinkLabel: 'Open in Google Maps',
        formTitle: 'Send a Message',
        formSuccessTitle: 'Message Sent!',
        formSuccessMessage:
          'Thank you for reaching out. We will get back to you as soon as possible.',
        submitButtonLabel: 'Send Message',
      },
      seo: {
        metaTitle: 'Contact | Kingdom Deliverance Centre Uganda',
        metaDescription: 'Get in touch with Kingdom Deliverance Centre Uganda in Kampala.',
      },
    },
  },
  {
    title: 'Give & Donate',
    slug: 'give',
    status: 'published',
    content: {
      pageType: 'give',
      isSystem: true,
      hero: {
        title: 'Give & Support the Ministry',
        subtitle: 'Your generosity helps us reach more lives across Uganda and beyond.',
      },
      donationIntroHtml:
        '<p>QR codes and payment details are managed under <strong>Settings → General</strong>. Use this area for a welcome message above the giving options.</p>',
      seo: {
        metaTitle: 'Give & Donate | Kingdom Deliverance Centre',
        metaDescription: 'Support Kingdom Deliverance Centre Uganda through secure giving options.',
      },
    },
  },
  {
    title: 'Prayer Requests',
    slug: 'prayer',
    status: 'published',
    content: {
      pageType: 'prayer',
      isSystem: true,
      hero: {
        title: 'Submit a Prayer Request',
        subtitle: 'Our prayer team intercedes for you. Requests can be marked private.',
      },
      bodyHtml:
        '<p>Encourage visitors to share their needs. The prayer form on the live site stays functional; this copy appears above it when CMS mode is on.</p>',
      seo: {
        metaTitle: 'Prayer Requests | Kingdom Deliverance Centre',
        metaDescription: 'Send a prayer request to Kingdom Deliverance Centre Uganda.',
      },
    },
  },
  {
    title: 'Fire Service',
    slug: 'fire-service',
    status: 'published',
    content: {
      pageType: 'fire_service',
      isSystem: true,
      hero: {
        title: 'Fire Service',
        subtitle: 'Experience powerful worship and deliverance with the Global Fire Altar.',
      },
      bodyHtml: '<p>Describe the Fire Service ministry, schedule, and what visitors can expect.</p>',
      ctaLabel: 'Join us Sunday',
      ctaUrl: '/events',
      seo: {
        metaTitle: 'Fire Service | Kingdom Deliverance Centre',
        metaDescription: 'Fire Service ministry at Kingdom Deliverance Centre Uganda.',
      },
    },
  },
  {
    title: 'Live Stream',
    slug: 'live',
    status: 'published',
    content: {
      pageType: 'live',
      isSystem: true,
      hero: {
        title: 'Watch Live',
        subtitle: 'Join our services online when you cannot be with us in person.',
      },
      liveStreamUrl: '',
      bodyHtml: '<p>Add any notes about service times or backup links below the player.</p>',
      seo: {
        metaTitle: 'Live Stream | Kingdom Deliverance Centre',
        metaDescription: 'Watch Kingdom Deliverance Centre Uganda services live online.',
      },
    },
  },
  {
    title: 'Testimonies',
    slug: 'testimonies',
    status: 'published',
    content: {
      pageType: 'testimonies',
      isSystem: true,
      hero: {
        title: 'Testimonies',
        subtitle: 'Stories of faith, healing, and breakthrough from our church family.',
      },
      excerpt:
        'Approved testimonies are managed under Admin → Testimonies. This intro appears above the public list.',
      seo: {
        metaTitle: 'Testimonies | Kingdom Deliverance Centre',
        metaDescription: 'Read testimonies from members of Kingdom Deliverance Centre Uganda.',
      },
    },
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy',
    status: 'draft',
    content: {
      pageType: 'privacy',
      isSystem: true,
      hero: { title: 'Privacy Policy' },
      bodyHtml: '<p>Add your privacy policy content here.</p>',
      seo: { metaTitle: 'Privacy Policy | Kingdom Deliverance Centre' },
    },
  },
  {
    title: 'Terms of Use',
    slug: 'terms',
    status: 'draft',
    content: {
      pageType: 'terms',
      isSystem: true,
      hero: { title: 'Terms of Use' },
      bodyHtml: '<p>Add your terms of use content here.</p>',
      seo: { metaTitle: 'Terms of Use | Kingdom Deliverance Centre' },
    },
  },
  {
    title: 'Ministries',
    slug: 'ministries',
    status: 'published',
    content: {
      pageType: 'listing',
      listingTarget: 'ministries',
      isSystem: true,
      hero: {
        title: 'Our Ministries',
        subtitle: 'Find a place to serve and grow in the body of Christ.',
      },
      excerpt: 'Individual ministries are edited under Admin → Ministries.',
      seo: {
        metaTitle: 'Ministries | Kingdom Deliverance Centre',
        metaDescription: 'Explore ministries at Kingdom Deliverance Centre Uganda.',
      },
    },
  },
  {
    title: 'Blog & News',
    slug: 'blog',
    status: 'published',
    content: {
      pageType: 'listing',
      listingTarget: 'blog',
      isSystem: true,
      hero: {
        title: 'Blog & News',
        subtitle: 'Updates, teachings, and news from Kingdom Deliverance Centre.',
      },
      excerpt: 'Posts are managed under Admin → Posts & Blogs.',
      seo: {
        metaTitle: 'Blog | Kingdom Deliverance Centre',
        metaDescription: 'Read articles and news from Kingdom Deliverance Centre Uganda.',
      },
    },
  },
  {
    title: 'Sermons',
    slug: 'sermons',
    status: 'published',
    content: {
      pageType: 'listing',
      listingTarget: 'sermons',
      isSystem: true,
      hero: {
        title: 'Sermons',
        subtitle: 'Watch or listen to messages from Bishop Climate and our teaching team.',
      },
      excerpt: 'Sermon messages are managed under Admin → Sermons.',
      seo: {
        metaTitle: 'Sermons | Kingdom Deliverance Centre',
        metaDescription: 'Sermons and teachings from Kingdom Deliverance Centre Uganda.',
      },
    },
  },
  {
    title: 'Events',
    slug: 'events',
    status: 'published',
    content: {
      pageType: 'listing',
      listingTarget: 'events',
      isSystem: true,
      hero: {
        title: 'Events',
        subtitle: 'Conferences, services, and special gatherings at KDC.',
      },
      excerpt: 'Events are managed under Admin → Events.',
      seo: {
        metaTitle: 'Events | Kingdom Deliverance Centre',
        metaDescription: 'Upcoming events at Kingdom Deliverance Centre Uganda.',
      },
    },
  },
  {
    title: 'KDC Store',
    slug: 'shop',
    status: 'published',
    content: {
      pageType: 'listing',
      listingTarget: 'shop',
      isSystem: true,
      hero: {
        title: 'KDC Store',
        subtitle: 'Books, resources, and merchandise to support your walk with God.',
      },
      excerpt: 'Products are managed under Admin → KDC Store.',
      seo: {
        metaTitle: 'Shop | Kingdom Deliverance Centre',
        metaDescription: 'Browse the Kingdom Deliverance Centre store.',
      },
    },
  },
  {
    title: 'Gallery',
    slug: 'gallery',
    status: 'published',
    content: {
      pageType: 'listing',
      listingTarget: 'gallery',
      isSystem: true,
      hero: {
        title: 'Photo Gallery',
        subtitle: 'Moments from worship, events, and life at KDC.',
      },
      excerpt: 'Photos are managed under Admin → Gallery.',
      seo: {
        metaTitle: 'Gallery | Kingdom Deliverance Centre',
        metaDescription: 'Photo gallery from Kingdom Deliverance Centre Uganda.',
      },
    },
  },
]
