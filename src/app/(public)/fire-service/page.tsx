import { FireServiceContent } from './fire-service-content'
import { getFireServiceSchedule } from '@/lib/fire-service-schedule'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fire Service - Kingdom Deliverance Centre Uganda',
  description:
    'Submit your Fire List for the monthly Fire Service on the last Friday of every month at Kingdom Deliverance Centre Uganda.',
}

export default function FireServicePage() {
  const schedule = getFireServiceSchedule()
  return <FireServiceContent schedule={schedule} />
}
