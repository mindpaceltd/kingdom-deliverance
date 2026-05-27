export type SupportContactMethod = 'email' | 'phone'

export interface SupportContactInput {
  name: string
  email?: string
  phone?: string
  contactMethod: SupportContactMethod
}

export function validateSupportContact(
  input: SupportContactInput
): { ok: true; name: string; email: string | null; phone: string | null } | { error: string } {
  const name = input.name.trim()
  if (name.length < 2) {
    return { error: 'Please enter your name.' }
  }

  const email = input.email?.trim() || ''
  const phone = input.phone?.trim() || ''

  if (input.contactMethod === 'email') {
    if (!email) return { error: 'Please enter your email address.' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: 'Please enter a valid email address.' }
    }
    return { ok: true, name, email, phone: null }
  }

  const digits = phone.replace(/\D/g, '')
  if (!phone) return { error: 'Please enter your phone number.' }
  if (digits.length < 9) {
    return { error: 'Please enter a valid phone number.' }
  }
  return { ok: true, name, email: null, phone }
}

export function conversationHasContact(conv: {
  visitor_name?: string | null
  visitor_email?: string | null
  visitor_phone?: string | null
}): boolean {
  const name = conv.visitor_name?.trim()
  const email = conv.visitor_email?.trim()
  const phone = conv.visitor_phone?.trim()
  return Boolean(name && name.length >= 2 && (email || phone))
}
