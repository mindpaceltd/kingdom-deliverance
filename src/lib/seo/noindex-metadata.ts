import type { Metadata } from 'next'

/** Metadata for transactional / utility pages that should not appear in search results. */
export const NOINDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}
