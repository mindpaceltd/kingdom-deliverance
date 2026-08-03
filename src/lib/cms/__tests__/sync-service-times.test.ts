import { describe, expect, it } from 'vitest'
import { parseServiceTimesText } from '../sync-service-times'

describe('parseServiceTimesText', () => {
  it('parses em-dash lines and adds EAT', () => {
    const slots = parseServiceTimesText(
      'Sunday English Service — 8:00 AM – 10:30 AM\nSunday Luganda Service — 10:30 AM – 2:00 PM'
    )
    expect(slots).toHaveLength(2)
    expect(slots[0].label).toBe('Sunday English Service')
    expect(slots[0].time).toContain('10:30 AM')
    expect(slots[0].time).toContain('EAT')
  })

  it('falls back to defaults when empty', () => {
    const slots = parseServiceTimesText('   \n  ')
    expect(slots.length).toBeGreaterThanOrEqual(4)
  })
})
