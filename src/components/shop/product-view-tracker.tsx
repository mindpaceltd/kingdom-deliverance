'use client'

import { useEffect, useRef } from 'react'
import { incrementProductViews } from '@/lib/actions/product-views'

export function ProductViewTracker({ productId }: { productId: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (!productId || tracked.current) return
    tracked.current = true
    void incrementProductViews(productId)
  }, [productId])

  return null
}
