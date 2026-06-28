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
      closes: '10:00',
      name: CHURCH_SERVICE_SLOTS[0].label,
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '11:00',
      closes: '14:00',
      name: CHURCH_SERVICE_SLOTS[1].label,
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Wednesday',
      opens: '21:00',
      closes: '23:00',
      name: CHURCH_SERVICE_SLOTS[2].label,
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Friday',
      opens: '21:00',
      closes: '23:00',
      name: CHURCH_SERVICE_SLOTS[3].label,
    },
  ]
}
