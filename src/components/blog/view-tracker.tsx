'use client'

import { useEffect } from 'react'
import { incrementPostViews } from '@/lib/actions/posts'

interface ViewTrackerProps {
  slug: string
  path: string
}

/**
 * Client component that fires incrementPostViews on mount.
 * Renders nothing — purely a side-effect component.
 */
export function ViewTracker({ slug, path }: ViewTrackerProps) {
  useEffect(() => {
    void incrementPostViews(slug, path)
  }, [slug, path])

  return null
}
