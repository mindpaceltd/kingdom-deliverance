'use client'

import * as React from 'react'
import { ImageIcon } from 'lucide-react'
import { getMediaImageSourcesFromUrl } from '@/lib/media/media-preview'
import { cn } from '@/lib/utils'

interface MediaUrlPreviewProps {
  url: string
  alt?: string
  className?: string
  imgClassName?: string
}

/** Renders a stored media URL with CDN-first loading and proxy fallback. */
export function MediaUrlPreview({
  url,
  alt = '',
  className,
  imgClassName,
}: MediaUrlPreviewProps) {
  const sources = React.useMemo(() => getMediaImageSourcesFromUrl(url), [url])
  const [sourceIndex, setSourceIndex] = React.useState(0)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    setSourceIndex(0)
    setFailed(false)
  }, [url])

  const src = sources[sourceIndex] ?? ''

  if (!url?.trim() || failed || !src) {
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
        if (sourceIndex < sources.length - 1) {
          setSourceIndex((i) => i + 1)
          return
        }
        setFailed(true)
      }}
    />
  )
}
