'use client'

import { useEffect, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { getMediaProxyUrl, normalizeMediaUrl } from '@/lib/media-url'

interface GalleryImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  fallbackClassName?: string
}

export function GalleryImage({
  src,
  alt,
  className = 'h-full w-full object-cover',
  fallbackClassName = 'flex h-full w-full items-center justify-center bg-muted',
}: GalleryImageProps) {
  const normalized = normalizeMediaUrl(src)
  const proxyUrl = getMediaProxyUrl(src)
  const [imgSrc, setImgSrc] = useState(normalized)
  const [failed, setFailed] = useState(!normalized)

  if (!normalized || failed) {
    return (
      <div className={fallbackClassName}>
        <ImageIcon className="h-10 w-10 text-primary/25" />
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
        } else {
          setFailed(true)
        }
      }}
    />
  )
}
