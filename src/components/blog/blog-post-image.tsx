'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import { normalizeMediaUrl, getMediaProxyUrl } from '@/lib/media-url'
import { cn } from '@/lib/utils'

function isHeic(url: string | null | undefined): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.endsWith('.heic') || lower.endsWith('.heif')
}

interface BlogPostImageProps {
  src?: string | null
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
  iconClassName?: string
}

export function BlogPostImage({
  src,
  alt,
  className,
  fill = true,
  sizes,
  iconClassName,
}: BlogPostImageProps) {
  const normalized = normalizeMediaUrl(src)
  const proxy = getMediaProxyUrl(src)
  const [activeSrc, setActiveSrc] = useState<string | null>(normalized)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setActiveSrc(normalized)
    setFailed(false)
  }, [normalized, src])

  if (!activeSrc || failed) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center bg-gray-100', className)}>
        <BookOpen className={cn('text-gray-300', iconClassName ?? 'h-12 w-12')} />
      </div>
    )
  }

  return (
    <Image
      src={activeSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      unoptimized={isHeic(activeSrc)}
      onError={() => {
        if (proxy && activeSrc !== proxy) setActiveSrc(proxy)
        else setFailed(true)
      }}
    />
  )
}
