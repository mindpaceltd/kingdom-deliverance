import { describe, it, expect } from 'vitest'
import {
  buildSearchConsoleSiteCandidates,
  getGscReportingDateRange,
  resolveSearchConsoleSiteUrls,
} from '../search-console-analytics'

describe('search-console-analytics', () => {
  it('ends reporting range before GSC data lag', () => {
    const { startDate, endDate } = getGscReportingDateRange(28)
    expect(startDate <= endDate).toBe(true)
    const end = new Date(`${endDate}T12:00:00Z`)
    const today = new Date()
    const diffDays = Math.round((today.getTime() - end.getTime()) / 86400000)
    expect(diffDays).toBeGreaterThanOrEqual(2)
  })

  it('builds URL prefix and domain candidates', () => {
    const candidates = buildSearchConsoleSiteCandidates('https://kdcuganda.org')
    expect(candidates).toContain('https://kdcuganda.org/')
    expect(candidates).toContain('sc-domain:kdcuganda.org')
  })

  it('prefers verified matching site from list', () => {
    const urls = resolveSearchConsoleSiteUrls('https://kdcuganda.org', [
      { siteUrl: 'https://kdcuganda.org/', permissionLevel: 'siteOwner' },
      { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
    ])
    expect(urls[0]).toBe('https://kdcuganda.org/')
  })
})
