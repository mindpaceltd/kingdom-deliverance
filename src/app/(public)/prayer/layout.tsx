import type { Metadata } from 'next'
import { buildListPageMetadata } from '@/lib/seo/list-page-metadata'
import { pageKeywords } from '@/lib/seo/brand-keywords'

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: 'Prayer Request',
    description:
      'Submit a prayer request to Kingdom Deliverance Centre Uganda. Our prayer team intercedes for healing, deliverance, and breakthrough in Kampala and beyond.',
    path: '/prayer',
    keywords: pageKeywords('prayer'),
  })
}

export default function PrayerLayout({ children }: { children: React.ReactNode }) {
  return children
}
