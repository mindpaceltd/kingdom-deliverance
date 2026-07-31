import type { Event } from '@/lib/types'
import {
  FIRE_SERVICE_LOCATION,
  getFireServiceSchedule,
  isFireServiceEvent,
  replaceFireServiceDatesInText,
} from '@/lib/fire-service-schedule'

/** Fix common location typos from legacy imports. */
export function normalizeEventLocation(location: string | null | undefined): string | null {
  if (!location?.trim()) return null
  return location
    .replace(/CenterKampala/gi, 'Center, Kampala')
    .replace(/Trading CenterKampala/gi, 'Trading Center, Kampala')
    .replace(/Lungujja,\s*Kosovo Trading CenterKampala/gi, 'Lungujja, Kosovo Trading Center, Kampala')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
}

export function withFireServiceSchedule<T extends Pick<Event, 'slug' | 'title' | 'date' | 'end_date' | 'description' | 'content' | 'location'>>(
  event: T,
  now = new Date(),
): T {
  if (!isFireServiceEvent(event)) {
    return {
      ...event,
      location: normalizeEventLocation(event.location) ?? event.location,
    }
  }

  const schedule = getFireServiceSchedule(now)

  return {
    ...event,
    date: schedule.startIso,
    end_date: schedule.endIso,
    location: FIRE_SERVICE_LOCATION,
    description: event.description
      ? replaceFireServiceDatesInText(event.description, schedule)
      : `🔥 Fire Service – ${schedule.formattedDate}\n\nSome battles only break in the place of fire. Bring your case before the Fire Altar tonight and let God intervene with power, deliverance, and answers.`,
    content: event.content
      ? replaceFireServiceDatesInText(event.content, schedule)
      : event.content,
  }
}

export function withFireServiceSchedules<T extends Pick<Event, 'slug' | 'title' | 'date' | 'end_date' | 'description' | 'content' | 'location'>>(
  events: T[],
  now = new Date(),
): T[] {
  return events.map((event) => withFireServiceSchedule(event, now))
}
