import { describe, expect, it } from 'vitest'
import {
  getFireServicePromoState,
  getFireServiceSchedule,
  getLastFridayOfMonth,
  getUpcomingFireServiceOccurrence,
  isFireServiceEvent,
  resolveFireServiceCtaTitle,
} from '@/lib/fire-service-schedule'
import { withFireServiceSchedule } from '@/lib/events/resolve-fire-service-event'

describe('fire-service-schedule', () => {
  it('finds the last Friday of the month', () => {
    expect(getLastFridayOfMonth(2026, 4)).toEqual({ year: 2026, month: 4, day: 29 })
    expect(getLastFridayOfMonth(2026, 5)).toEqual({ year: 2026, month: 5, day: 26 })
    expect(getLastFridayOfMonth(2026, 6)).toEqual({ year: 2026, month: 6, day: 31 })
  })

  it('rolls to the next month after the current service ends', () => {
    const afterJuneService = new Date('2026-06-27T20:00:00.000Z')
    expect(getUpcomingFireServiceOccurrence(afterJuneService)).toEqual({
      year: 2026,
      month: 6,
      day: 31,
    })
  })

  it('keeps the current month before the service ends', () => {
    const beforeJuneService = new Date('2026-06-26T12:00:00.000Z')
    expect(getUpcomingFireServiceOccurrence(beforeJuneService)).toEqual({
      year: 2026,
      month: 5,
      day: 26,
    })
  })

  it('builds the homepage CTA title from the computed date', () => {
    const title = resolveFireServiceCtaTitle('🔥 The Fire Service 🔥', new Date('2026-06-20T12:00:00.000Z'))
    expect(title).toBe('🔥 The Fire Service: Friday, June 26, 2026 🔥')
  })

  it('updates the recurring fire service event dates', () => {
    const updated = withFireServiceSchedule(
      {
        slug: 'fire-service-night-of-prayer-deliverance-kdc',
        title: 'Fire Service Night of Prayer & Deliverance | KDC',
        date: '2026-01-01T00:00:00.000Z',
        end_date: '2026-01-01T01:00:00.000Z',
        description: 'Friday, May 29, 2026',
        content: '<p>Friday, June 26, 2026</p>',
      },
      new Date('2026-06-20T12:00:00.000Z'),
    )

    expect(isFireServiceEvent(updated)).toBe(true)
    expect(updated.description).toContain('Friday, June 26, 2026')
    expect(updated.content).toContain('Friday, June 26, 2026')
    expect(new Date(updated.date).toISOString()).toBe(getFireServiceSchedule(new Date('2026-06-20T12:00:00.000Z')).startIso)
  })

  it('uses 7 PM – 9 PM EAT for the service window', () => {
    const schedule = getFireServiceSchedule(new Date('2026-06-20T12:00:00.000Z'))
    expect(schedule.formattedTime).toBe('6:00 PM — 9:30 PM (EAT)')
  })

  it('shows the promo one week before through the end of the service', () => {
    const beforeWindow = getFireServicePromoState(new Date('2026-06-18T12:00:00.000Z'))
    expect(beforeWindow.shouldShow).toBe(false)

    const inWindow = getFireServicePromoState(new Date('2026-06-20T12:00:00.000Z'))
    expect(inWindow.shouldShow).toBe(true)
    expect(inWindow.daysUntil).toBeGreaterThan(0)

    const onServiceDay = getFireServicePromoState(new Date('2026-06-26T10:00:00.000Z'))
    expect(onServiceDay.shouldShow).toBe(true)
    expect(onServiceDay.isToday).toBe(true)

    const afterService = getFireServicePromoState(new Date('2026-06-26T20:00:00.000Z'))
    expect(afterService.shouldShow).toBe(false)
  })
})
