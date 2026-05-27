export const SUPPORT_BOT_NAME = 'KDC Assistant'

export const BOT_WELCOME =
  'Welcome to Kingdom Deliverance Centre Uganda support. I can help with quick answers, or connect you with a team member.'

export const BOT_QUICK_REPLIES = [
  { id: 'hours', label: 'Service times', reply: 'service_times' },
  { id: 'contact', label: 'Contact details', reply: 'contact' },
  { id: 'agent', label: 'Chat with a person', reply: 'agent' },
] as const

export interface SupportBotFacts {
  contactUrl?: string
  email?: string
  phones?: string[]
  address?: string
  serviceTimes?: string
}

function joinLines(lines: Array<string | null | undefined>): string {
  return lines.filter(Boolean).join('\n')
}

export function detectBotIntent(message: string): 'service_times' | 'contact' | 'agent' | null {
  const text = message.toLowerCase()

  if (
    /(human|person|agent|staff|team member|talk to someone|speak to someone|representative)/.test(
      text
    )
  ) {
    return 'agent'
  }

  if (/(service|time|hours|when|sunday|wednesday|friday|schedule|program)/.test(text)) {
    return 'service_times'
  }

  if (/(contact|phone|call|email|address|location|where|find|map|reach)/.test(text)) {
    return 'contact'
  }

  return null
}

export function getBotReply(key: string, facts?: SupportBotFacts): string | null {
  const contactUrl = facts?.contactUrl || 'https://kdcuganda.org/contact'
  const email = facts?.email
  const phones = (facts?.phones ?? []).filter((phone) => phone.trim())
  const address = facts?.address?.trim()
  const serviceTimes = facts?.serviceTimes?.trim()

  switch (key) {
    case 'service_times':
      return (
        joinLines([
          serviceTimes ? `Our service times are:\n${serviceTimes}` : null,
          `For updates and directions: ${contactUrl}`,
        ]) ||
        `Please see our latest service schedule here: ${contactUrl}`
      )
    case 'contact':
      return (
        joinLines([
          email ? `Email: ${email}` : null,
          phones.length > 0 ? `Phone: ${phones.join(' / ')}` : null,
          address ? `Address: ${address}` : null,
          `More details: ${contactUrl}`,
        ]) ||
        `You can reach us here: ${contactUrl}`
      )
    case 'agent':
      return 'I am connecting you with our support team. A staff member will reply here as soon as possible. Please share your question below.'
    default:
      return null
  }
}
