'use client'

import * as React from 'react'
import { File, FileText, Music, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MediaAsset } from '@/lib/types'

function TypeIcon({ type, className }: { type: MediaAsset['type']; className?: string }) {
  switch (type) {
    case 'audio':
      return <Music className={className} />
    case 'video':
      return <Video className={className} />
    case 'document':
      return <FileText className={className} />
    default:
      return <File className={className} />
  }
}

interface LazyMediaThumbProps {
  asset: MediaAsset
  selected: boolean
  onSelect: () => void
}

export function LazyMediaThumb({ asset, selected, onSelect }: LazyMediaThumbProps) {
  const rootRef = React.useRef<HTMLButtonElement>(null)
  const [shouldLoad, setShouldLoad] = React.useState(false)

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '240px 0px', threshold: 0.01 }
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
      {asset.type === 'image' ? (
        shouldLoad ? (
          // Native img: lazy decode without loading hundreds of Next/Image instances
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.url}
            alt={asset.alt_text ?? asset.filename}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" aria-hidden />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <TypeIcon type={asset.type} className="size-8 opacity-40" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
          Select
        </span>
      </div>
    </button>
  )
}
