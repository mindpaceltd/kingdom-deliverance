import type { Event } from '@/lib/types'
import {
  getFireServiceSchedule,
  isFireServiceEvent,
  replaceFireServiceDatesInText,
} from '@/lib/fire-service-schedule'

export function withFireServiceSchedule<T extends Pick<Event, 'slug' | 'title' | 'date' | 'end_date' | 'description' | 'content'>>(
  event: T,
  now = new Date(),
): T {
  if (!isFireServiceEvent(event)) return event

  const schedule = getFireServiceSchedule(now)

  return {
    ...event,
    date: schedule.startIso,
    end_date: schedule.endIso,
    description: event.description
      ? replaceFireServiceDatesInText(event.description, schedule)
      : `🔥 Fire Service – ${schedule.formattedDate}\n\nSome battles only break in the place of fire. Bring your case before the Fire Altar tonight and let God intervene with power, deliverance, and answers.`,
    content: event.content
      ? replaceFireServiceDatesInText(event.content, schedule)
      : event.content,
  }
}

export function withFireServiceSchedules<T extends Pick<Event, 'slug' | 'title' | 'date' | 'end_date' | 'description' | 'content'>>(
  events: T[],
  now = new Date(),
): T[] {
  return events.map((event) => withFireServiceSchedule(event, now))
}
