import type { Event } from '@/lib/types'
import {
  FIRE_SERVICE_LOCATION,
  FIRE_SERVICE_EVENT_SLUG,
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

/** Always provide the monthly service, even when no CMS event has been created. */
export function createRecurringFireServiceEvent(now = new Date()): Event {
  const schedule = getFireServiceSchedule(now)
  return {
    id: 'recurring-fire-service', slug: FIRE_SERVICE_EVENT_SLUG,
    title: 'Fire Service — Night of Prayer & Deliverance',
    description: 'Join us at the Fire Altar for worship, prayer and deliverance. Bring your prayer requests and come expectant. Last Friday of every month.',
    content: '<p>Gather with Kingdom Deliverance Centre Uganda for our monthly Fire Service: a night of worship, prayer, deliverance and restoration.</p><p>Bring your prayer requests and join our church family at Kosovo–Lungujja, Kampala. The service takes place on the last Friday of every month, from 6:00 PM to 9:30 PM EAT.</p>',
    date: schedule.startIso, end_date: schedule.endIso,
    location: FIRE_SERVICE_LOCATION, image_url: 'https://kdcuganda.org/events/fire-service-monthly.webp',
    is_featured: true, registration_url: null, status: 'upcoming',
    published_at: null, scheduled_at: null, deleted_at: null,
    created_at: schedule.startIso, updated_at: schedule.startIso,
    meta_title: null, meta_description: null, focus_keyword: null, seo_score: 0, views: 0,
  }
}

/** Resolve recurrence before filtering: stored dates must never hide the next service. */
export function getPublicEventListings(events: Event[], now = new Date()) {
  const publicEvents = events.filter(event => ['published', 'upcoming', 'ongoing', 'past'].includes(event.status))
  const recurring = publicEvents.find(event => event.slug === FIRE_SERVICE_EVENT_SLUG)
    ?? publicEvents.find(isFireServiceEvent)
    ?? createRecurringFireServiceEvent(now)
  const nextFireService = {
    ...withFireServiceSchedule(recurring, now), status: 'upcoming' as const,
    image_url: 'https://kdcuganda.org/events/fire-service-monthly.webp',
  }
  const others = publicEvents.filter(event => !isFireServiceEvent(event))
  const upcoming = [nextFireService, ...others.filter(event =>
    event.status !== 'past' && new Date(event.end_date || event.date).getTime() >= now.getTime(),
  )].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const past = others.filter(event => event.status === 'past' || new Date(event.end_date || event.date).getTime() < now.getTime())
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,8)
  return { upcoming, past }
}
