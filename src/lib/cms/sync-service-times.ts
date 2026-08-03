import type { SupabaseClient } from '@supabase/supabase-js'
import { CHURCH_SERVICE_SLOTS, CHURCH_SERVICE_TIMES_DISPLAY, CHURCH_SERVICE_TIMES_FAQ } from '@/lib/church-service-times'

export type ServiceSlot = { label: string; time: string }

/** Parse admin `service_times` textarea into hero slots. */
export function parseServiceTimesText(text: string): ServiceSlot[] {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const slots: ServiceSlot[] = []
  for (const line of lines) {
    const parts = line.split(/\s+[—–-]\s+/)
    if (parts.length >= 2) {
      const label = parts[0].trim()
      let time = parts.slice(1).join(' — ').trim()
      if (time && !/\bEAT\b/i.test(time)) time = `${time} (EAT)`
      if (label && time) slots.push({ label, time })
      continue
    }
    // "Label: time" form
    const colon = line.match(/^([^:]+):\s*(.+)$/)
    if (colon) {
      let time = colon[2].trim()
      if (time && !/\bEAT\b/i.test(time)) time = `${time} (EAT)`
      slots.push({ label: colon[1].trim(), time })
    }
  }

  return slots.length ? slots : CHURCH_SERVICE_SLOTS.map((s) => ({ ...s }))
}

function toDisplayText(slots: ServiceSlot[]): string {
  return slots.map((s) => `${s.label.replace(/\s*\(.*?\)\s*$/, '')}: ${s.time}`).join('\n')
}

function deepUpdateFaqAnswers(node: unknown, faqAnswer: string): unknown {
  if (Array.isArray(node)) return node.map((n) => deepUpdateFaqAnswers(n, faqAnswer))
  if (!node || typeof node !== 'object') return node
  const obj = { ...(node as Record<string, unknown>) }
  const question = typeof obj.question === 'string' ? obj.question : ''
  const answer = typeof obj.answer === 'string' ? obj.answer : ''
  if (
    answer &&
    (/service times|when (are|do) (your|the) service|sunday english|bible study/i.test(question) ||
      /Sunday English Service from/i.test(answer))
  ) {
    obj.answer = faqAnswer
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'answer' && obj.answer === faqAnswer) continue
    obj[k] = deepUpdateFaqAnswers(v, faqAnswer)
  }
  return obj
}

/**
 * When site_settings.service_times changes, push the same schedule into
 * published home / contact / FAQ CMS pages so the public site stays consistent.
 */
export async function syncServiceTimesToCms(
  admin: SupabaseClient,
  serviceTimesText: string
): Promise<{ updated: string[] }> {
  const slots = parseServiceTimesText(serviceTimesText)
  const display = slots.length ? toDisplayText(slots) : CHURCH_SERVICE_TIMES_DISPLAY
  const faqAnswer = CHURCH_SERVICE_TIMES_FAQ.replace(
    /Our regular services are[\s\S]*?EAT\)\./,
    (() => {
      const english = slots.find((s) => /english/i.test(s.label))
      const luganda = slots.find((s) => /luganda/i.test(s.label))
      const wed = slots.find((s) => /bible|wednesday/i.test(s.label))
      const fri = slots.find((s) => /fire|friday|prayer/i.test(s.label))
      const bits = [
        english && `Sunday English Service from ${english.time.replace(/\s*\(EAT\)\s*$/i, '')} (EAT)`,
        luganda && `Sunday Luganda Service from ${luganda.time.replace(/\s*\(EAT\)\s*$/i, '')} (EAT)`,
        wed && `Wednesday Bible Study from ${wed.time.replace(/\s*\(EAT\)\s*$/i, '').replace(/^Wed(nesday)?\s*/i, '')} (EAT)`,
        fri &&
          `Fire Service on the last Friday of each month from ${fri.time.replace(/\s*\(EAT\)\s*$/i, '').replace(/^Fri(day)?\s*/i, '')} (EAT)`,
      ].filter(Boolean)
      return bits.length
        ? `Our regular services are ${bits.join(', ')}.`
        : CHURCH_SERVICE_TIMES_FAQ.split(' For any')[0]
    })()
  )

  const updated: string[] = []
  const now = new Date().toISOString()

  const { data: pages } = await admin
    .from('pages')
    .select('id, slug, status, content_json')
    .in('slug', ['home', 'contact', 'faq', ''])
    .eq('status', 'published')

  for (const page of pages ?? []) {
    const content = { ...((page.content_json as Record<string, unknown>) ?? {}) }
    let changed = false

    if (page.slug === 'home' || page.slug === '') {
      content.serviceSlots = slots
      changed = true
    }

    if (page.slug === 'contact') {
      content.serviceTimes = display
      changed = true
    }

    if (page.slug === 'faq') {
      const next = deepUpdateFaqAnswers(content, faqAnswer) as Record<string, unknown>
      Object.assign(content, next)
      changed = true
    }

    if (!changed) continue

    const { error } = await admin
      .from('pages')
      .update({ content_json: content, updated_at: now })
      .eq('id', page.id)

    if (!error) updated.push(page.slug || 'home')
  }

  return { updated }
}
