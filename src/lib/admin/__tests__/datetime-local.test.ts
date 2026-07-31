import { describe, expect, it } from 'vitest'
import {
  defaultScheduleDatetimeLocal,
  formatScheduledPublishLabel,
  localDatetimeInputToIso,
  toLocalDatetimeInputValue,
} from '@/lib/admin/datetime-local'

describe('datetime-local helpers', () => {
  it('round-trips ISO timestamps through datetime-local format', () => {
    const iso = '2026-08-01T06:00:00.000Z'
    const local = toLocalDatetimeInputValue(iso)
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    expect(localDatetimeInputToIso(local)).toBeTruthy()
  })

  it('formats a human-readable schedule label', () => {
    const label = formatScheduledPublishLabel('2026-08-01T09:00')
    expect(label).toBeTruthy()
  })

  it('returns a default future schedule value', () => {
    const value = defaultScheduleDatetimeLocal()
    const iso = localDatetimeInputToIso(value)
    expect(iso).toBeTruthy()
    expect(new Date(iso!).getTime()).toBeGreaterThan(Date.now())
  })
})
