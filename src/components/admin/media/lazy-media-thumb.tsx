'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MediaAsset } from '@/lib/types'
import { MediaFilePreview } from '@/components/admin/media/media-file-preview'

interface LazyMediaThumbProps {
  asset: MediaAsset
  /** Opened in the detail sheet */
  selected: boolean
  /** Selected for bulk actions */
  checked: boolean
  onSelect: () => void
  onToggleCheck: () => void
}

export function LazyMediaThumb({
  asset,
  selected,
  checked,
  onSelect,
  onToggleCheck,
}: LazyMediaThumbProps) {
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
        selected || checked
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-transparent'
      )}
    >
      <span
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        data-bulk-check
        onClick={(e) => {
          e.stopPropagation()
          onToggleCheck()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            onToggleCheck()
          }
        }}
        className={cn(
          'absolute left-1.5 top-1.5 z-30 flex size-5 items-center justify-center rounded border shadow-sm transition-opacity',
          checked
            ? 'border-primary bg-primary text-primary-foreground opacity-100'
            : 'border-white/80 bg-black/50 text-white opacity-0 group-hover:opacity-100'
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>

      {inView ? (
        <MediaFilePreview asset={asset} active={inView} variant="thumb" />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" aria-hidden />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
          Details
        </span>
      </div>
    </button>
  )
}
