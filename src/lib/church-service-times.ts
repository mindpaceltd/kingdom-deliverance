export const CHURCH_SERVICE_SLOTS = [
  { label: 'Sunday English Service', time: '8:00 AM – 10:00 AM (EAT)' },
  { label: 'Sunday Luganda Service', time: '11:00 AM – 2:00 PM (EAT)' },
  { label: 'Bible Study', time: 'Wed 9:00 PM (EAT)' },
  { label: 'Prayer Meeting', time: 'Fri 9:00 PM (EAT)' },
] as const

export const CHURCH_SERVICE_TIMES_TEXT =
  'Sunday English Service — 8:00 AM – 10:00 AM\nSunday Luganda Service — 11:00 AM – 2:00 PM\nWednesday Bible Study — 9:00 PM\nFriday Fire Service — 9:00 PM'

export const CHURCH_SERVICE_TIMES_DISPLAY =
  'Sunday English: 8:00 AM – 10:00 AM (EAT)\nSunday Luganda: 11:00 AM – 2:00 PM (EAT)\nWednesday: 9:00 PM (EAT)\nFriday: 9:00 PM (EAT)'

export const CHURCH_SERVICE_TIMES_FAQ =
  'Our regular services are Sunday English Service from 8:00 AM to 10:00 AM (EAT), Sunday Luganda Service from 11:00 AM to 2:00 PM (EAT), Wednesday at 9:00 PM (EAT), and Friday at 9:00 PM (EAT). For any special service updates, please check the Contact page or announcements on our social channels.'

export const CHURCH_SERVICE_FOOTER = [
  { day: 'Sunday (English)', time: '8:00 AM – 10:00 AM (EAT)' },
  { day: 'Sunday (Luganda)', time: '11:00 AM – 2:00 PM (EAT)' },
  { day: 'Wednesday', time: '9:00 PM (EAT)' },
  { day: 'Friday', time: '9:00 PM (EAT)' },
] as const

export const CHURCH_LIVE_SCHEDULE = [
  { day: 'Sunday', time: '8:00 AM – 10:00 AM (EAT)', label: 'English Service' },
  { day: 'Sunday', time: '11:00 AM – 2:00 PM (EAT)', label: 'Luganda Service' },
  { day: 'Wednesday', time: '9:00 PM (EAT)', label: 'Bible Study' },
  { day: 'Friday', time: '9:00 PM (EAT)', label: 'Prayer Meeting' },
] as const
