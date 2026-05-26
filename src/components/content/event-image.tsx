'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { getMediaProxyUrl, normalizeMediaUrl } from '@/lib/media-url'

interface EventImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  fallbackClassName?: string
}

export function EventImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackClassName = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10',
}: EventImageProps) {
  const normalized = normalizeMediaUrl(src)
  const proxyUrl = getMediaProxyUrl(src)
  const [imgSrc, setImgSrc] = useState(normalized)
  const [failed, setFailed] = useState(!normalized)

  if (!normalized || failed) {
    return (
      <div className={fallbackClassName}>
        <Calendar className="w-12 h-12 text-primary/25" />
      </div>
    )
  }

  return (
    <img
      src={imgSrc || undefined}
      alt={alt}
      className={className}
      onError={() => {
        if (proxyUrl && imgSrc !== proxyUrl) {
          setImgSrc(proxyUrl)
          return
        }
        setFailed(true)
      }}
    />
  )
}
