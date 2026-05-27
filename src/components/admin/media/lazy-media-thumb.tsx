'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { MediaAsset } from '@/lib/types'
import { MediaFilePreview } from '@/components/admin/media/media-file-preview'

interface LazyMediaThumbProps {
  asset: MediaAsset
  selected: boolean
  onSelect: () => void
}

export function LazyMediaThumb({ asset, selected, onSelect }: LazyMediaThumbProps) {
  const rootRef = React.useRef<HTMLButtonElement>(null)
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px 0px', threshold: 0.01 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [asset.id])

  return (
    <button
      ref={rootRef}
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex aspect-square flex-col overflow-hidden rounded-lg border-2 bg-muted transition-all hover:ring-2 hover:ring-primary/20',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
      )}
    >
      {inView ? (
        <MediaFilePreview asset={asset} active={inView} variant="thumb" />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" aria-hidden />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
          Select
        </span>
      </div>
    </button>
  )
}
