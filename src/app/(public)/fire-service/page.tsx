import { FireServiceContent } from './fire-service-content'
import { getFireServiceSchedule } from '@/lib/fire-service-schedule'
import type { Metadata } from 'next'
import { buildListPageMetadata } from '@/lib/seo/list-page-metadata'
import { pageKeywords } from '@/lib/seo/brand-keywords'

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: 'Fire Service',
    description:
      'Submit your Fire List for the monthly Fire Service — last Friday of every month at Kingdom Deliverance Centre Uganda, Kampala.',
    path: '/fire-service',
    keywords: pageKeywords('fireService'),
  })
}

export default function FireServicePage() {
  const schedule = getFireServiceSchedule()
  return <FireServiceContent schedule={schedule} />
}
