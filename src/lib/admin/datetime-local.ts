/** Format an ISO timestamp for `<input type="datetime-local" />`. */
export function toLocalDatetimeInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Parse a datetime-local value (or ISO string) to ISO for Postgres. */
export function localDatetimeInputToIso(value: string): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

/** Default schedule: tomorrow at 9:00 AM local time. */
export function defaultScheduleDatetimeLocal(): string {
  const next = new Date()
  next.setDate(next.getDate() + 1)
  next.setHours(9, 0, 0, 0)
  return toLocalDatetimeInputValue(next.toISOString())
}

export function formatScheduledPublishLabel(isoOrLocal: string): string | null {
  const iso = localDatetimeInputToIso(isoOrLocal)
  if (!iso) return null
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
