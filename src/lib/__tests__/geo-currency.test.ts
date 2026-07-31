import { describe, expect, it } from 'vitest'
import { DEFAULT_SITE_CURRENCY, detectCurrencyFromCountry } from '@/lib/geo-currency'

describe('detectCurrencyFromCountry', () => {
  it('defaults to UGX when country is unknown', () => {
    expect(detectCurrencyFromCountry(null)).toBe(DEFAULT_SITE_CURRENCY)
  })

  it('uses UGX for Uganda and East Africa on kdcuganda.org', () => {
    expect(detectCurrencyFromCountry('UG')).toBe('UGX')
    expect(detectCurrencyFromCountry('KE')).toBe('UGX')
    expect(detectCurrencyFromCountry('TZ')).toBe('UGX')
    expect(detectCurrencyFromCountry('RW')).toBe('UGX')
  })

  it('uses GBP, USD, and EUR for major international regions', () => {
    expect(detectCurrencyFromCountry('GB')).toBe('GBP')
    expect(detectCurrencyFromCountry('US')).toBe('USD')
    expect(detectCurrencyFromCountry('DE')).toBe('EUR')
  })

  it('falls back to USD for other countries', () => {
    expect(detectCurrencyFromCountry('NG')).toBe('USD')
    expect(detectCurrencyFromCountry('ZA')).toBe('USD')
  })
})
