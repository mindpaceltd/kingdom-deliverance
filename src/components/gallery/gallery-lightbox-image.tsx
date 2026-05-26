'use client'

import { useEffect, useState } from 'react'
import { getMediaProxyUrl, normalizeMediaUrl } from '@/lib/media-url'

interface GalleryLightboxImageProps {
  imageUrl: string
  alt: string
  className?: string
}

/** Main lightbox slide — always reloads when imageUrl changes. */
export function GalleryLightboxImage({
  imageUrl,
  alt,
  className,
}: GalleryLightboxImageProps) {
  const primary = normalizeMediaUrl(imageUrl) ?? ''
  const proxy = getMediaProxyUrl(imageUrl)
  const [src, setSrc] = useState(primary)

  useEffect(() => {
    setSrc(normalizeMediaUrl(imageUrl) ?? '')
  }, [imageUrl])

  if (!primary && !proxy) {
    return null
  }

  return (
    <img
      src={src || primary}
      alt={alt}
      className={className}
      decoding="async"
      onError={() => {
        if (proxy && src !== proxy) setSrc(proxy)
      }}
    />
  )
}
