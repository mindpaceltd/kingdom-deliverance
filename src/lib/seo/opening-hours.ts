import { CHURCH_SERVICE_SLOTS } from '@/lib/church-service-times'

export interface OpeningHoursSpecification {
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: string | string[]
  opens: string
  closes: string
  name?: string
}

/** Schema.org opening hours derived from published church service times. */
export function buildChurchOpeningHoursSpecification(): OpeningHoursSpecification[] {
  return [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '08:00',
      closes: '10:30',
      name: CHURCH_SERVICE_SLOTS[0].label,
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '10:30',
      closes: '14:00',
      name: CHURCH_SERVICE_SLOTS[1].label,
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Wednesday',
      opens: '18:00',
      closes: '21:30',
      name: CHURCH_SERVICE_SLOTS[2].label,
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Friday',
      opens: '18:00',
      closes: '21:30',
      name: CHURCH_SERVICE_SLOTS[3].label,
    },
  ]
}
