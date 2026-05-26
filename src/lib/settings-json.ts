/** Safe JSON helpers for site_settings JSON fields (social links, phones, QR codes). */

export function safeJsonParse<T>(raw: string | undefined, fallback: T): T {
  if (!raw?.trim()) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function parseStringArray(raw: string | undefined): string[] {
  const parsed = safeJsonParse<unknown>(raw, [])
  if (!Array.isArray(parsed)) return []
  return parsed.filter((x): x is string => typeof x === 'string')
}

export function parseSocialLinks(
  raw: string | undefined
): { platform: string; url: string }[] {
  const parsed = safeJsonParse<unknown>(raw, [])
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter((x): x is { platform: string; url: string } =>
      Boolean(x && typeof x === 'object' && 'platform' in x && 'url' in x)
    )
    .map((x) => ({
      platform: String((x as { platform: string }).platform),
      url: String((x as { url: string }).url),
    }))
}

export function parseQrCodes(
  raw: string | undefined
): { id: string; title: string; subtitle: string; value: string; color: string }[] {
  const parsed = safeJsonParse<unknown>(raw, [])
  if (!Array.isArray(parsed)) return []
  return parsed.map((entry, idx) => {
    const e = entry as Record<string, string>
    return {
      id: e.id || `qr-${idx}`,
      title: e.title || '',
      subtitle: e.subtitle || '',
      value: e.value || '',
      color: e.color || '#1a1a2e',
    }
  })
}
