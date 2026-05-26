'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { GalleryImage } from '@/components/content/gallery-image'
import { cn } from '@/lib/utils'

export interface GalleryGridItem {
  id: string
  /** DB title (optional) */
  title?: string | null
  /** DB caption / description (optional) */
  description?: string | null
  /** Caption shown to visitors: description, else title, else album label */
  caption: string
  category: string
  image_url: string
}

function itemCaption(item: GalleryGridItem): string {
  return item.caption.trim() || item.category
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

interface GalleryLightboxGridProps {
  items: GalleryGridItem[]
}

export function GalleryLightboxGrid({ items }: GalleryLightboxGridProps) {
  const shuffled = React.useMemo(() => shuffle(items), [items])
  const [openIndex, setOpenIndex] = React.useState<number | null>(null)

  const total = shuffled.length
  const current = openIndex !== null ? shuffled[openIndex] : null

  const go = React.useCallback(
    (delta: number) => {
      setOpenIndex((idx) => {
        if (idx === null || total === 0) return idx
        return (idx + delta + total) % total
      })
    },
    [total]
  )

  React.useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIndex(null)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [openIndex, go])

  if (total === 0) return null

  const prevIndex = openIndex !== null ? (openIndex - 1 + total) % total : 0
  const nextIndex = openIndex !== null ? (openIndex + 1) % total : 0
  const neighborIndices = [prevIndex, openIndex ?? 0, nextIndex]

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
        {shuffled.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative aspect-square overflow-hidden rounded-md border border-primary/10 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <GalleryImage
              src={item.image_url}
              alt={itemCaption(item)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <p className="line-clamp-2 text-left text-[9px] font-medium leading-tight text-white sm:text-[10px]">
                {itemCaption(item)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {openIndex !== null && current && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image viewer"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <div className="min-w-0 flex-1 pr-4">
              <p className="truncate text-lg font-semibold md:text-xl">
                {itemCaption(current)}
              </p>
              <p className="text-xs text-white/60">
                {openIndex + 1} of {total}
                {current.category ? ` · ${current.category}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              className="rounded-full p-2 hover:bg-white/10"
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-14 md:px-20">
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 md:left-4"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>

            <div className="relative flex h-[min(70vh,720px)] w-full max-w-5xl items-center justify-center">
              <GalleryImage
                src={current.image_url}
                alt={itemCaption(current)}
                className="max-h-[min(70vh,720px)] max-w-full object-contain"
                fallbackClassName="flex h-48 w-48 items-center justify-center rounded-lg bg-white/10"
              />
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 md:right-4"
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>

          {current.description?.trim() && (
            <p className="mx-auto max-w-3xl px-6 pb-3 text-center text-sm leading-relaxed text-white/85 md:text-base">
              {current.description.trim()}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 border-t border-white/10 px-4 py-4">
            {neighborIndices.map((idx, i) => {
              const item = shuffled[idx]
              const isCenter = i === 1
              return (
                <button
                  key={`${item.id}-${i}`}
                  type="button"
                  onClick={() => setOpenIndex(idx)}
                  className={cn(
                    'relative shrink-0 overflow-hidden rounded-md border-2 transition-all',
                    isCenter
                      ? 'h-20 w-28 border-accent opacity-100 md:h-24 md:w-32'
                      : 'h-14 w-20 border-white/20 opacity-70 hover:opacity-100 md:h-16 md:w-24'
                  )}
                >
                  <GalleryImage
                    src={item.image_url}
                    alt={itemCaption(item)}
                    className="h-full w-full object-cover"
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
