'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  mainImage: string
  gallery: { image_url: string; alt_text?: string }[]
  name: string
}

export function ProductGallery({ mainImage, gallery, name }: ProductGalleryProps) {
  const allImages = React.useMemo(() => [
    { image_url: mainImage, alt_text: name },
    ...(gallery || [])
  ], [mainImage, gallery, name])

  const [activeIndex, setActiveIndex] = React.useState(0)

  return (
    <div className="space-y-6">
      <div className="relative aspect-square rounded-[2rem] sm:rounded-[3rem] overflow-hidden bg-muted border border-border shadow-2xl shadow-primary/5 group">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            src={allImages[activeIndex]?.image_url}
            alt={allImages[activeIndex]?.alt_text || name}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {allImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 sm:gap-4 px-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300",
                activeIndex === index 
                  ? "border-accent scale-105 shadow-lg ring-4 ring-accent/10" 
                  : "border-transparent opacity-60 hover:opacity-100 grayscale hover:grayscale-0 hover:scale-105"
              )}
            >
              <img
                src={image.image_url}
                alt={`${name} gallery ${index}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
