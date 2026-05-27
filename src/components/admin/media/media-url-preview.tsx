'use client'

import * as React from 'react'
import { ImageIcon } from 'lucide-react'
import { getMediaProxyUrl, normalizeMediaUrl } from '@/lib/media-url'
import { cn } from '@/lib/utils'

interface MediaUrlPreviewProps {
  url: string
  alt?: string
  className?: string
  imgClassName?: string
}

/** Renders a stored media URL with CDN normalization and `/api/media/asset` fallback. */
export function MediaUrlPreview({
  url,
  alt = '',
  className,
  imgClassName,
}: MediaUrlPreviewProps) {
  const normalized = normalizeMediaUrl(url) ?? url
  const [src, setSrc] = React.useState(normalized)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    setSrc(normalized)
    setFailed(false)
  }, [url, normalized])

  if (!url?.trim() || failed) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center bg-muted text-muted-foreground',
          className
        )}
      >
        <ImageIcon className="size-8 opacity-40" aria-hidden />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn('h-full w-full object-cover', imgClassName, className)}
      onError={() => {
        const proxy = getMediaProxyUrl(url)
        if (proxy && src !== proxy) {
          setSrc(proxy)
          return
        }
        setFailed(true)
      }}
    />
  )
}
