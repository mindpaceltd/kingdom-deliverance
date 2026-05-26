import { format, isValid, parseISO } from 'date-fns'

const OLD_R2_PUBLIC_HOSTS = [
  'pub-2f08fcf0958c4e15a15b48f6805de2be.r2.dev',
  'pub-6299bd19a8614368b611590ccf05ac14.r2.dev',
]

function getPublicBase(): string {
  return (
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') ||
    'https://pub-6299bd19a8614368b611590ccf05ac14.r2.dev'
  )
}

export function getKeyFromMediaUrl(url: string): string | null {
  if (!url) return null
  const base = getPublicBase()
  if (url.startsWith(base)) {
    return url.slice(base.length).replace(/^\/+/, '')
  }
  for (const host of OLD_R2_PUBLIC_HOSTS) {
    const marker = `${host}/`
    const idx = url.indexOf(marker)
    if (idx !== -1) return url.slice(idx + marker.length).replace(/^\/+/, '')
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url.replace(/^\/+/, '')
  }
  return null
}

/** Rewrite legacy R2 public hostnames to the current public CDN base. */
export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null

  const trimmed = url.trim()
  const key = getKeyFromMediaUrl(trimmed)
  if (key) return `${getPublicBase()}/${key}`

  if (!trimmed.startsWith('http')) {
    return `${getPublicBase()}/${trimmed.replace(/^\/+/, '')}`
  }

  return trimmed
}

/** Fallback proxy when a public R2 URL 404s but the object exists in private storage. */
export function getMediaProxyUrl(url: string | null | undefined): string | null {
  const key = url ? getKeyFromMediaUrl(normalizeMediaUrl(url) || url) : null
  if (!key) return null
  return `/api/media/asset?key=${encodeURIComponent(key)}`
}

export function toValidDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = parseISO(value)
  if (isValid(parsed)) return parsed
  const fallback = new Date(value)
  return isValid(fallback) ? fallback : null
}

export function formatSafeDate(
  value: string | null | undefined,
  pattern: string,
  fallback = 'Date TBA'
): string {
  const date = toValidDate(value)
  if (!date) return fallback
  try {
    return format(date, pattern)
  } catch {
    return fallback
  }
}
