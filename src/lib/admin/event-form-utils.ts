/** Normalize datetime-local or ISO strings for Postgres timestamptz. */
export function normalizeEventDatetime(value: string): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed.toISOString()
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

export function validateEventForm(input: {
  title: string
  slug: string
  date: string
  slugError?: string | null
}): string | null {
  if (!input.title.trim()) return 'Event title is required.'
  if (!input.slug.trim()) return 'URL slug is required — wait for auto-slug or enter one.'
  if (!input.date.trim()) return 'Start date and time are required.'
  if (input.slugError) return input.slugError
  return null
}

export const EVENT_INDEXABLE_STATUSES = new Set(['published', 'upcoming', 'ongoing'])

export function isEventStatusIndexable(status: string): boolean {
  return EVENT_INDEXABLE_STATUSES.has(status)
}
