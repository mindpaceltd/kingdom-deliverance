import { format } from 'date-fns'

export const FIRE_SERVICE_EVENT_SLUG = 'fire-service-night-of-prayer-deliverance-kdc'
const EAT_TIMEZONE = 'Africa/Kampala'
/** Last Friday of each month, 6:00 PM – 10:00 PM EAT */
export const FIRE_SERVICE_START_HOUR = 18
export const FIRE_SERVICE_END_HOUR = 22
export const FIRE_SERVICE_PROMO_LEAD_DAYS = 7
export const FIRE_SERVICE_LOCATION = 'Kingdom Deliverance Centre, Kosovo–Lungujja, Kampala'
export const FIRE_SERVICE_TIME_LABEL = '6:00 PM — 10:00 PM (EAT)'

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
    formattedTime: FIRE_SERVICE_TIME_LABEL,
    ctaTitle: `🔥 The Fire Service: ${formattedDate} 🔥`,
  }
}

export interface FireServicePromoState {
  shouldShow: boolean
  isToday: boolean
  isLive: boolean
  daysUntil: number
  storageKey: string
  schedule: FireServiceSchedule
}

/** Start of promo window: 7 days before the service day (EAT midnight). */
function getPromoWindowStart(schedule: FireServiceSchedule): Date {
  const serviceDayStart = eatOccurrenceToUtcDate(schedule.occurrence, 0, 0)
  return new Date(
    serviceDayStart.getTime() - FIRE_SERVICE_PROMO_LEAD_DAYS * 24 * 60 * 60 * 1000,
  )
}

function isSameEatDay(a: DateParts, occurrence: FireServiceOccurrence): boolean {
  return a.year === occurrence.year && a.month === occurrence.month && a.day === occurrence.day
}

/**
 * Whether the site-wide Fire Service promo should appear.
 * Visible from 7 days before through the end of the service (10 PM EAT).
 */
export function getFireServicePromoState(now = new Date()): FireServicePromoState {
  const schedule = getFireServiceSchedule(now)
  const promoStart = getPromoWindowStart(schedule)
  const shouldShow = now.getTime() >= promoStart.getTime() && now.getTime() <= schedule.end.getTime()

  const eatNow = getEatParts(now)
  const isToday = isSameEatDay(eatNow, schedule.occurrence)
  const isLive =
    isToday && now.getTime() >= schedule.start.getTime() && now.getTime() <= schedule.end.getTime()

  const msUntilStart = schedule.start.getTime() - now.getTime()
  const daysUntil = Math.max(0, Math.ceil(msUntilStart / (24 * 60 * 60 * 1000)))

  const storageKey = `kdc-fire-service-${schedule.occurrence.year}-${schedule.occurrence.month + 1}-${schedule.occurrence.day}`

  return { shouldShow, isToday, isLive, daysUntil, storageKey, schedule }
}

/** Serializable payload for the client promo popup. */
export function getFireServicePromoPayload(now = new Date()) {
  const state = getFireServicePromoState(now)
  return {
    shouldShow: state.shouldShow,
    isToday: state.isToday,
    isLive: state.isLive,
    daysUntil: state.daysUntil,
    storageKey: state.storageKey,
    formattedDate: state.schedule.formattedDate,
    formattedTime: state.schedule.formattedTime,
    ctaTitle: state.schedule.ctaTitle,
    location: FIRE_SERVICE_LOCATION,
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
