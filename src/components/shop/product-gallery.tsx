'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  mainImage: string
  gallery?: { image_url: string; alt_text?: string }[]
  name: string
  thumbnailOnly?: boolean
}

export function ProductGallery({ mainImage, gallery, name, thumbnailOnly = false }: ProductGalleryProps) {
  const allImages = React.useMemo(() => [
    { image_url: mainImage, alt_text: name },
    ...(gallery || []).filter(g => g.image_url && g.image_url !== mainImage)
  ], [mainImage, gallery, name])

  const [activeIndex, setActiveIndex] = React.useState(0)

  // Thumbnail-only mode: just show the strip of thumbnails (used on product page where main image is above)
  if (thumbnailOnly) {
    if (allImages.length <= 1) return null
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {allImages.map((image, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'relative shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-200',
              activeIndex === index
                ? 'border-[#d4a017] shadow-md'
                : 'border-gray-200 opacity-70 hover:opacity-100'
            )}
          >
            <img
              src={image.image_url}
              alt={image.alt_text || `${name} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    )
  }

  // Full gallery mode (with main image + thumbnails below)
  return (
    <div className="space-y-3">
      {/* Main active image */}
      <div className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
        <img
          src={allImages[activeIndex]?.image_url}
          alt={allImages[activeIndex]?.alt_text || name}
          className="w-full aspect-[4/3] object-cover transition-opacity duration-300"
        />
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-200',
                activeIndex === index
                  ? 'border-[#d4a017] shadow-md'
                  : 'border-gray-200 opacity-70 hover:opacity-100'
              )}
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
