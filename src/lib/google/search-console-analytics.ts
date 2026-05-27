/** Google Search Console reporting is typically 2–3 days behind real time. */
export const GSC_DATA_LAG_DAYS = 3

export type GscSiteEntry = {
  siteUrl?: string | null
  permissionLevel?: string | null
}

export function formatGscDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Inclusive reporting window ending before GSC data lag. */
export function getGscReportingDateRange(dayCount: number): {
  startDate: string
  endDate: string
} {
  const days = Math.max(1, Math.min(dayCount, 480))
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - GSC_DATA_LAG_DAYS)

  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (days - 1))

  return {
    startDate: formatGscDate(start),
    endDate: formatGscDate(end),
  }
}

export function isValidSearchConsoleSiteUrl(siteUrl: string): boolean {
  const trimmed = siteUrl.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('sc-domain:')) {
    return trimmed.length > 'sc-domain:'.length
  }
  try {
    const withProto = trimmed.includes('://') ? trimmed : `https://${trimmed}`
    new URL(withProto)
    return true
  } catch {
    return false
  }
}

/** URL-prefix and domain property variants for API queries. */
export function buildSearchConsoleSiteCandidates(configured: string): string[] {
  const trimmed = configured.trim()
  const out = new Set<string>()
  if (!trimmed) return []

  out.add(trimmed)

  if (trimmed.startsWith('sc-domain:')) {
    return [...out]
  }

  try {
    const withProto = trimmed.includes('://') ? trimmed : `https://${trimmed}`
    const url = new URL(withProto)
    const origin = url.origin
    out.add(`${origin}/`)
    out.add(origin)
    const bareHost = url.hostname.replace(/^www\./, '')
    out.add(`sc-domain:${bareHost}`)
    if (!url.hostname.startsWith('www.')) {
      out.add(`https://www.${url.hostname}/`)
      out.add(`https://www.${url.hostname}`)
    }
  } catch {
    // keep configured value only
  }

  return [...out]
}

function hostFromConfigured(configured: string): string | null {
  if (configured.startsWith('sc-domain:')) {
    return configured.slice('sc-domain:'.length).toLowerCase()
  }
  try {
    const withProto = configured.includes('://') ? configured : `https://${configured}`
    return new URL(withProto).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function hostFromSiteUrl(siteUrl: string): string | null {
  if (siteUrl.startsWith('sc-domain:')) {
    return siteUrl.slice('sc-domain:'.length).toLowerCase()
  }
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function isVerifiedSite(entry: GscSiteEntry): boolean {
  if (!entry.siteUrl) return false
  const level = String(entry.permissionLevel ?? '').toLowerCase()
  return level.includes('owner') || level.includes('full') || level === 'siteowner'
}

/** Prefer verified properties that match the saved site URL. */
export function resolveSearchConsoleSiteUrls(
  configured: string,
  siteEntries: GscSiteEntry[]
): string[] {
  const candidates = buildSearchConsoleSiteCandidates(configured)
  const verified = siteEntries.filter(isVerifiedSite)
  const ordered: string[] = []

  for (const candidate of candidates) {
    if (verified.some((s) => s.siteUrl === candidate) && !ordered.includes(candidate)) {
      ordered.push(candidate)
    }
  }

  const targetHost = hostFromConfigured(configured)
  if (targetHost) {
    for (const entry of verified) {
      const siteUrl = entry.siteUrl!
      const entryHost = hostFromSiteUrl(siteUrl)
      if (entryHost === targetHost && !ordered.includes(siteUrl)) {
        ordered.push(siteUrl)
      }
    }
  }

  for (const entry of verified) {
    const siteUrl = entry.siteUrl!
    if (!ordered.includes(siteUrl)) ordered.push(siteUrl)
  }

  for (const candidate of candidates) {
    if (!ordered.includes(candidate)) ordered.push(candidate)
  }

  return ordered
}

export function hasSearchAnalyticsRows(data: { rows?: unknown[] | null } | null | undefined): boolean {
  return Array.isArray(data?.rows) && data.rows.length > 0
}
