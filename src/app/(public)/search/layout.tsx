import type { Metadata } from 'next'
import { NOINDEX_METADATA } from '@/lib/seo/noindex-metadata'

export const metadata: Metadata = NOINDEX_METADATA

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
