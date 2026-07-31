export const CHURCH_SERVICE_SLOTS = [
  { label: 'Sunday English Service', time: '8:00 AM – 10:00 AM (EAT)' },
  { label: 'Sunday Luganda Service', time: '10:00 AM – 2:00 PM (EAT)' },
  { label: 'Bible Study', time: 'Wed 7:00 PM – 9:00 PM (EAT)' },
  { label: 'Fire Service', time: 'Fri 7:00 PM – 9:00 PM (EAT)' },
] as const

export const CHURCH_SERVICE_TIMES_TEXT =
  'Sunday English Service — 8:00 AM – 10:00 AM\nSunday Luganda Service — 10:00 AM – 2:00 PM\nWednesday Bible Study — 7:00 PM – 9:00 PM\nFriday Fire Service — 7:00 PM – 9:00 PM'

export const CHURCH_SERVICE_TIMES_DISPLAY =
  'Sunday English: 8:00 AM – 10:00 AM (EAT)\nSunday Luganda: 10:00 AM – 2:00 PM (EAT)\nWednesday: 7:00 PM – 9:00 PM (EAT)\nFriday Fire Service: 7:00 PM – 9:00 PM (EAT)'

export const CHURCH_SERVICE_TIMES_FAQ =
  'Our regular services are Sunday English Service from 8:00 AM to 10:00 AM (EAT), Sunday Luganda Service from 10:00 AM to 2:00 PM (EAT), Wednesday Bible Study from 7:00 PM to 9:00 PM (EAT), and Fire Service on the last Friday of each month from 7:00 PM to 9:00 PM (EAT). For any special service updates, please check the Contact page or announcements on our social channels.'

export const CHURCH_SERVICE_FOOTER = [
  { day: 'Sunday (English)', time: '8:00 AM – 10:00 AM (EAT)' },
  { day: 'Sunday (Luganda)', time: '10:00 AM – 2:00 PM (EAT)' },
  { day: 'Wednesday', time: '7:00 PM – 9:00 PM (EAT)' },
  { day: 'Friday (Fire Service)', time: '7:00 PM – 9:00 PM (EAT)' },
] as const

export const CHURCH_LIVE_SCHEDULE = [
  { day: 'Sunday', time: '8:00 AM – 10:00 AM (EAT)', label: 'English Service' },
  { day: 'Sunday', time: '10:00 AM – 2:00 PM (EAT)', label: 'Luganda Service' },
  { day: 'Wednesday', time: '7:00 PM – 9:00 PM (EAT)', label: 'Bible Study' },
  { day: 'Friday', time: '7:00 PM – 9:00 PM (EAT)', label: 'Fire Service' },
] as const
