import type { Metadata } from 'next'
import { buildListPageMetadata } from '@/lib/seo/list-page-metadata'
import { pageKeywords } from '@/lib/seo/brand-keywords'

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: 'Give Online',
    description:
      'Give securely online to Kingdom Deliverance Centre Uganda — tithes, offerings, and ministry support via mobile money and card.',
    path: '/donations',
    keywords: pageKeywords('donations'),
  })
}

export default function DonationsLayout({ children }: { children: React.ReactNode }) {
  return children
}
