import { describe, it, expect } from 'vitest'
import { buildChurchOpeningHoursSpecification } from '../opening-hours'
import { parseChurchPostalAddress } from '../parse-church-address'

describe('buildChurchOpeningHoursSpecification', () => {
  it('includes Sunday, Wednesday, and Friday service windows', () => {
    const hours = buildChurchOpeningHoursSpecification()
    expect(hours).toHaveLength(4)
    expect(hours.some((h) => h.dayOfWeek === 'Sunday' && h.opens === '08:00')).toBe(true)
    expect(hours.some((h) => h.dayOfWeek === 'Wednesday' && h.opens === '21:00')).toBe(true)
    expect(hours.some((h) => h.dayOfWeek === 'Friday' && h.opens === '21:00')).toBe(true)
  })
})

describe('parseChurchPostalAddress', () => {
  it('returns Kampala defaults when address is empty', () => {
    const parsed = parseChurchPostalAddress(null)
    expect(parsed.addressLocality).toBe('Kampala')
    expect(parsed.addressCountry).toBe('UG')
    expect(parsed.streetAddress).toContain('Kosovo')
  })

  it('parses multiline CMS addresses', () => {
    const parsed = parseChurchPostalAddress('KDC Centre\nKampala, Uganda')
    expect(parsed.streetAddress).toBe('KDC Centre')
    expect(parsed.addressLocality).toBe('Kampala')
  })
})
