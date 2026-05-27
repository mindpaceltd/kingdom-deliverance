'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { GalleryImage } from '@/components/content/gallery-image'
import { GalleryCaptionOverlay } from '@/components/gallery/gallery-caption-overlay'
import { GalleryLightboxImage } from '@/components/gallery/gallery-lightbox-image'
import { cn } from '@/lib/utils'

export interface GalleryGridItem {
  id: string
  title?: string | null
  description?: string | null
  caption: string
  category: string
  image_url: string
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
  const thumbRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const [zoom, setZoom] = React.useState(1)

  const ZOOM_MIN = 1
  const ZOOM_MAX = 3
  const ZOOM_STEP = 0.25

  const clampZoom = (z: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z))

  function zoomIn() {
    setZoom((z) => clampZoom(z + ZOOM_STEP))
  }

  function zoomOut() {
    setZoom((z) => clampZoom(z - ZOOM_STEP))
  }

  function resetZoom() {
    setZoom(ZOOM_MIN)
  }

  const total = shuffled.length
  const current =
    openIndex !== null && openIndex >= 0 && openIndex < total
      ? shuffled[openIndex]
      : null

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
      if (e.key === '+' || e.key === '=') zoomIn()
      if (e.key === '-' || e.key === '_') zoomOut()
      if (e.key === '0') resetZoom()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [openIndex, go])

  React.useEffect(() => {
    if (openIndex === null) return
    setZoom(ZOOM_MIN)
    const el = thumbRefs.current[openIndex]
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [openIndex])

  if (total === 0) return null

  return (
    <>
      <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6">
        {shuffled.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative block w-full overflow-hidden rounded-xl border border-primary/10 bg-muted shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
              <GalleryImage
                src={item.image_url}
                alt={item.caption}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <GalleryCaptionOverlay caption={item.caption} />
            </div>
          </button>
        ))}
      </div>

      {openIndex !== null && current && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={current.caption}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 px-3 py-3 text-white sm:px-5 sm:py-4">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-snug sm:text-xl md:text-2xl">
                {current.caption}
              </p>
              <p className="mt-1 text-xs text-white/60 sm:text-sm">
                {openIndex + 1} of {total}
                {current.category ? ` · ${current.category}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              className="shrink-0 rounded-full p-2 hover:bg-white/10"
              aria-label="Close gallery"
            >
              <X className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-10 sm:px-14 md:px-20">
            {total > 1 && (
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 sm:left-3 sm:p-3"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
              </button>
            )}

            <div
              className="relative flex max-h-[50vh] w-full max-w-5xl items-center justify-center sm:max-h-[58vh] md:max-h-[62vh]"
              onWheel={(e) => {
                // Prevent page scroll while zooming in the lightbox.
                e.preventDefault()
                if (e.deltaY < 0) zoomIn()
                else zoomOut()
              }}
              onDoubleClick={() => setZoom((z) => (z <= ZOOM_MIN ? 2 : ZOOM_MIN))}
            >
              <div
                className="flex w-full items-center justify-center"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 120ms ease-out',
                  willChange: 'transform',
                }}
              >
                <GalleryLightboxImage
                  key={`${current.id}-${current.image_url}`}
                  imageUrl={current.image_url}
                  alt={current.caption}
                  className="max-h-[50vh] max-w-full object-contain sm:max-h-[58vh] md:max-h-[62vh]"
                />
              </div>

              <div className="absolute right-3 top-3 z-30 flex items-center gap-2 rounded-full bg-black/30 px-2 py-1 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={zoomOut}
                  className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white hover:bg-white/15"
                  aria-label="Zoom out"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white hover:bg-white/15"
                  aria-label="Reset zoom"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={zoomIn}
                  className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white hover:bg-white/15"
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
            </div>

            {total > 1 && (
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 sm:right-3 sm:p-3"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
              </button>
            )}
          </div>

          <div className="shrink-0 border-t border-white/15 bg-black/40 px-4 py-3 sm:px-6 sm:py-4">
            <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-white sm:text-base">
              {current.caption}
            </p>
            {current.description?.trim() &&
              current.description.trim() !== current.caption && (
                <p className="mx-auto mt-2 max-w-3xl text-center text-xs leading-relaxed text-white/70 sm:text-sm">
                  {current.description.trim()}
                </p>
              )}
          </div>

          {total > 0 && (
            <div className="shrink-0 overflow-x-auto border-t border-white/10 px-3 py-3 sm:px-4">
              <div className="flex min-w-min items-center justify-center gap-2">
                {shuffled.map((item, idx) => {
                  const isActive = idx === openIndex
                  return (
                    <button
                      key={item.id}
                      ref={(el) => {
                        thumbRefs.current[idx] = el
                      }}
                      type="button"
                      onClick={() => setOpenIndex(idx)}
                      aria-label={`View ${item.caption}`}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'relative shrink-0 overflow-hidden rounded-md border-2 transition-all',
                        isActive
                          ? 'h-16 w-24 border-accent ring-2 ring-accent/50 sm:h-20 sm:w-28'
                          : 'h-12 w-16 border-white/25 opacity-80 hover:opacity-100 sm:h-14 sm:w-20'
                      )}
                    >
                      <GalleryImage
                        key={`thumb-${item.id}`}
                        src={item.image_url}
                        alt={item.caption}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
