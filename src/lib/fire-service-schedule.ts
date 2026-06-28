import { format } from 'date-fns'

export const FIRE_SERVICE_EVENT_SLUG = 'fire-service-night-of-prayer-deliverance-kdc'
const EAT_TIMEZONE = 'Africa/Kampala'
const FIRE_SERVICE_START_HOUR = 21
const FIRE_SERVICE_END_HOUR = 24

export interface FireServiceOccurrence {
  year: number
  month: number
  day: number
}

export interface FireServiceSchedule {
  occurrence: FireServiceOccurrence
  start: Date
  end: Date
  startIso: string
  endIso: string
  formattedDate: string
  formattedTime: string
  ctaTitle: string
}

type DateParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function getEatParts(date = new Date()): DateParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: EAT_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date)

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)

  return {
    year: read('year'),
    month: read('month') - 1,
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
  }
}

export function getLastFridayOfMonth(year: number, month: number): FireServiceOccurrence {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let day = daysInMonth
  const dayOfWeek = new Date(year, month, day).getDay()
  const daysBack = (dayOfWeek + 2) % 7
  day -= daysBack
  return { year, month, day }
}

function eatOccurrenceToUtcDate(
  occurrence: FireServiceOccurrence,
  hour: number,
  minute = 0,
): Date {
  const asEat = new Date(
    Date.UTC(occurrence.year, occurrence.month, occurrence.day, hour, minute, 0),
  )
  return new Date(asEat.getTime() - 3 * 60 * 60 * 1000)
}

export function getUpcomingFireServiceOccurrence(now = new Date()): FireServiceOccurrence {
  const eatNow = getEatParts(now)
  let occurrence = getLastFridayOfMonth(eatNow.year, eatNow.month)
  let end = eatOccurrenceToUtcDate(occurrence, FIRE_SERVICE_END_HOUR)

  if (now.getTime() > end.getTime()) {
    const nextMonth = eatNow.month === 11 ? 0 : eatNow.month + 1
    const nextYear = eatNow.month === 11 ? eatNow.year + 1 : eatNow.year
    occurrence = getLastFridayOfMonth(nextYear, nextMonth)
  }

  return occurrence
}

export function getFireServiceSchedule(now = new Date()): FireServiceSchedule {
  const occurrence = getUpcomingFireServiceOccurrence(now)
  const start = eatOccurrenceToUtcDate(occurrence, FIRE_SERVICE_START_HOUR)
  const end = eatOccurrenceToUtcDate(occurrence, FIRE_SERVICE_END_HOUR)
  const formattedDate = format(start, 'EEEE, MMMM d, yyyy')

  return {
    occurrence,
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    formattedDate,
    formattedTime: '9:00 PM — 12:00 Midnight (EAT)',
    ctaTitle: `🔥 The Fire Service: ${formattedDate} 🔥`,
  }
}

export function isFireServiceEvent(event: {
  slug?: string | null
  title?: string | null
}): boolean {
  const slug = event.slug?.trim().toLowerCase() ?? ''
  const title = event.title?.trim().toLowerCase() ?? ''
  return (
    slug === FIRE_SERVICE_EVENT_SLUG ||
    slug.includes('fire-service') ||
    title.includes('fire service')
  )
}

const FIRE_SERVICE_DATE_PATTERN =
  /(?:Friday,\s*)?(?:\w+day,\s*)?\w+\s+\d{1,2},\s+\d{4}/gi

export function replaceFireServiceDatesInText(
  text: string,
  schedule: FireServiceSchedule,
): string {
  return text.replace(FIRE_SERVICE_DATE_PATTERN, schedule.formattedDate)
}

export function resolveFireServiceCtaTitle(cmsTitle?: string | null, now = new Date()): string {
  const schedule = getFireServiceSchedule(now)
  const trimmed = cmsTitle?.trim()
  if (!trimmed) return schedule.ctaTitle
  if (/fire service/i.test(trimmed)) return schedule.ctaTitle
  return trimmed
}
