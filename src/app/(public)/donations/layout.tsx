import type { Metadata } from 'next'
import { buildListPageMetadata } from '@/lib/seo/list-page-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: 'Give Online',
    description:
      'Give securely online to Kingdom Deliverance Centre Uganda — tithes, offerings, and ministry support via mobile money and card.',
    path: '/donations',
    keywords: 'donate KDC Uganda, online giving Kampala church, tithe Uganda, church offering online',
  })
}

export default function DonationsLayout({ children }: { children: React.ReactNode }) {
  return children
}
