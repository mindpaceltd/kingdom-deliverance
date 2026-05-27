export const SUPPORT_BOT_NAME = 'KDC Assistant'

export const BOT_WELCOME =
  'Welcome to Kingdom Deliverance Centre Uganda support. I can help with quick answers, or connect you with a team member.'

export const BOT_QUICK_REPLIES = [
  { id: 'hours', label: 'Service times', reply: 'service_times' },
  { id: 'contact', label: 'Contact details', reply: 'contact' },
  { id: 'agent', label: 'Chat with a person', reply: 'agent' },
] as const

export function getBotReply(key: string): string | null {
  switch (key) {
    case 'service_times':
      return 'Our regular services are on Sunday and mid-week — check the Contact page on kdcuganda.org/contact for the latest service times and location.'
    case 'contact':
      return 'You can reach us at info@kdcuganda.org or visit kdcuganda.org/contact for phone, email, and directions.'
    case 'agent':
      return 'I am connecting you with our support team. A staff member will reply here as soon as possible. Please share your question below.'
    default:
      return null
  }
}
