import type { CmsFaqDetails, CmsFaqSection } from '@/lib/cms/page-content'

const FALLBACK_FAQ_SECTIONS: CmsFaqSection[] = [
  {
    title: 'Services & Worship',
    items: [
      {
        question: 'What are your regular service times?',
        answer:
          'Our regular services are Sunday at 10:00 AM (EAT), Wednesday at 6:00 PM (EAT), and Friday at 6:00 PM (EAT). For any special service updates, please check the Contact page or announcements on our social channels.',
      },
      {
        question: 'Where is Kingdom Deliverance Centre Uganda located?',
        answer:
          'We are based in Kampala, Uganda. You can find full directions and map details on our Contact page.',
      },
      {
        question: 'Do you have online/live services?',
        answer:
          "Yes. You can watch online sermons and live sessions through our website's Live and Sermons sections whenever streams are available.",
      },
    ],
  },
  {
    title: 'Giving & Donations',
    items: [
      {
        question: 'How can I give or donate?',
        answer:
          'You can donate securely through our Give/Donations pages. We support trusted payment options configured on the website.',
      },
      {
        question: 'Are donations refundable?',
        answer:
          'Donations are generally non-refundable unless there is a clear payment processing error. If you need help with a donation issue, contact support with your transaction details.',
      },
      {
        question: 'Will I receive confirmation after donating?',
        answer:
          'Yes. Donation confirmations are provided through the checkout flow and may also be sent by email when contact details are available.',
      },
    ],
  },
  {
    title: 'Support & Contact',
    items: [
      {
        question: 'How do I contact your team quickly?',
        answer:
          'You can use the support chat button on the bottom-left of the website for quick help, or reach us through the Contact page.',
      },
      {
        question: 'Can I request prayer support?',
        answer:
          'Yes. You can submit prayer requests through the Prayer page, and our team will stand with you in faith.',
      },
      {
        question: 'How can I speak to a human support agent?',
        answer:
          'Open the website chat and choose "Chat with a person," then share your question. A staff member will reply as soon as possible.',
      },
    ],
  },
  {
    title: 'Website & Account',
    items: [
      {
        question: 'Do I need an account to browse sermons, events, and ministries?',
        answer:
          'No. Most content is publicly accessible. You only need an account for features like orders, downloads, and account-specific history.',
      },
      {
        question: 'I forgot my account password. What should I do?',
        answer:
          'Go to the login page and use "Forgot password" to reset your password securely.',
      },
      {
        question: 'Where can I read your legal policies?',
        answer:
          'You can view our Privacy Policy and Terms of Service from the footer on every page.',
      },
    ],
  },
]

const DEFAULT_FAQ_DETAILS: CmsFaqDetails = {
  intro:
    'Quick answers about services, giving, support, and using the KDC Uganda website.',
  lastUpdatedLabel: 'Last Updated:',
  lastUpdated: 'May 27, 2026',
  sections: FALLBACK_FAQ_SECTIONS,
  helpTitle: 'Still need help?',
  helpMessageLead: 'Reach out on our',
  helpLinkLabel: 'Contact page',
  helpLinkUrl: '/contact',
  helpMessageTail:
    'or use the support chat at the bottom-left corner of this website.',
}

function pickString(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

export function defaultFaqDetails(): CmsFaqDetails {
  return {
    ...DEFAULT_FAQ_DETAILS,
    sections: DEFAULT_FAQ_DETAILS.sections?.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    })),
  }
}

export function resolveFaqDetails(cms?: CmsFaqDetails | null): CmsFaqDetails {
  const defaults = defaultFaqDetails()
  return {
    ...defaults,
    ...cms,
    intro: pickString(cms?.intro, defaults.intro),
    lastUpdatedLabel: pickString(cms?.lastUpdatedLabel, defaults.lastUpdatedLabel),
    lastUpdated: pickString(cms?.lastUpdated, defaults.lastUpdated),
    helpTitle: pickString(cms?.helpTitle, defaults.helpTitle),
    helpMessageLead: pickString(cms?.helpMessageLead, defaults.helpMessageLead),
    helpLinkLabel: pickString(cms?.helpLinkLabel, defaults.helpLinkLabel),
    helpLinkUrl: pickString(cms?.helpLinkUrl, defaults.helpLinkUrl),
    helpMessageTail: pickString(cms?.helpMessageTail, defaults.helpMessageTail),
    helpText: pickString(cms?.helpText, defaults.helpText),
    sections: cms?.sections?.length ? cms.sections : defaults.sections,
  }
}

/** Default hero background for the FAQ page (editable in Admin → Pages → FAQ). */
export const DEFAULT_FAQ_HERO_IMAGE =
  'https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=2069&auto=format&fit=crop'
