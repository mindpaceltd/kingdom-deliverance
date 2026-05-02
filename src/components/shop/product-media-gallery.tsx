'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type GalleryImage = { image_url: string; alt_text?: string }

interface ProductMediaGalleryProps {
  mainImage: string
  gallery?: GalleryImage[]
  name: string
  hasDiscount?: boolean
  typeLabel?: string
  className?: string
}

export function ProductMediaGallery({
  mainImage,
  gallery,
  name,
  hasDiscount = false,
  typeLabel,
  className,
}: ProductMediaGalleryProps) {
  const images = React.useMemo<GalleryImage[]>(
    () => [
      { image_url: mainImage, alt_text: name },
      ...(gallery || []).filter((g) => g.image_url && g.image_url !== mainImage),
    ],
    [mainImage, gallery, name]
  )

  const [activeIndex, setActiveIndex] = React.useState(0)
  const active = images[activeIndex] || images[0]

  return (
    <div className={cn('space-y-4 p-2', className)}>
      <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200">
        {hasDiscount && (
          <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-black uppercase px-2.5 py-1 rounded">
            SALE!
          </span>
        )}
        {typeLabel && (
          <span className="absolute top-3 right-3 z-10 bg-[#1e3a5f] text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded">
            {typeLabel}
          </span>
        )}
        <img
          src={active?.image_url}
          alt={active?.alt_text || name}
          className="w-full aspect-[3/4] object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image.image_url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 bg-white',
                activeIndex === index
                  ? 'border-[#d4a017] shadow-md'
                  : 'border-gray-200 opacity-70 hover:opacity-100'
              )}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={image.image_url}
                alt={image.alt_text || `${name} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

