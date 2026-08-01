import { describe, expect, it } from 'vitest'
import {
  BRAND_ALTERNATE_NAMES,
  PAGE_KEYWORDS,
  pageKeywords,
  siteKeywordsString,
} from '@/lib/seo/brand-keywords'

describe('brand-keywords', () => {
  it('includes core brand and location terms site-wide', () => {
    const keywords = siteKeywordsString().toLowerCase()
    expect(keywords).toContain('kdc')
    expect(keywords).toContain('kingdom deliverance centre')
    expect(keywords).toContain('fire service')
    expect(keywords).toContain('kosovo')
    expect(keywords).toContain('kampala church')
  })

  it('exposes JSON-LD alternate names', () => {
    expect(BRAND_ALTERNATE_NAMES).toContain('KDC')
    expect(BRAND_ALTERNATE_NAMES).toContain('Kosovo Lungujja Church')
  })

  it('merges page-specific keywords with brand terms', () => {
    const fire = pageKeywords('fireService').toLowerCase()
    expect(fire).toContain('fire service')
    expect(fire).toContain('kdc')
    expect(PAGE_KEYWORDS.fireService.some((k) => fire.includes(k.toLowerCase()))).toBe(true)
  })
})
