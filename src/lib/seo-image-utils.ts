/**
 * SEO Image Utilities - Ensures proper social sharing images
 */

import { getKeyFromMediaUrl, normalizeMediaUrl } from '@/lib/media-url'

const SITE_ORIGIN = 'https://kdcuganda.org'

const PLACEHOLDER_HOSTS = ['pollinations.ai', 'unsplash.com', 'images.unsplash.com']

export function stripHtmlExcerpt(html: string | null | undefined, maxLength = 160): string {
  if (!html?.trim()) return ''
  const plain = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, maxLength - 1).trim()}…`
}

function isPlaceholderImage(url: string | null | undefined): boolean {
  if (!url) return true
  const lower = url.toLowerCase()
  return PLACEHOLDER_HOSTS.some((host) => lower.includes(host))
}

/** Absolute URL that social crawlers can fetch (R2 assets use the media proxy). */
export function toAbsoluteSocialImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null

  const normalized = normalizeMediaUrl(url.trim())
  if (!normalized) return null

  const key = getKeyFromMediaUrl(normalized)
  if (key) {
    return `${SITE_ORIGIN}/api/media/asset?key=${encodeURIComponent(key)}`
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized
  }

  return `${SITE_ORIGIN}${normalized.startsWith('/') ? '' : '/'}${normalized}`
}

export function generateSeoImage(
  title: string,
  description?: string,
  type: 'blog' | 'sermon' | 'event' | 'ministry' | 'product' | 'default' = 'default'
): string {
  const baseUrl = 'https://kdcuganda.org'
  const encodedTitle = encodeURIComponent(title.substring(0, 60))
  const encodedDesc = encodeURIComponent(description?.substring(0, 100) || '')
  
  // Use branded OG image generator with fallback
  return `${baseUrl}/og?title=${encodedTitle}&description=${encodedDesc}&type=${type}`
}

export function resolveShareImageUrl(
  title: string,
  description: string,
  contentImage?: string | null,
  orgOgImage?: string | null,
  type: 'blog' | 'sermon' | 'event' | 'ministry' | 'product' | 'default' = 'default'
): string {
  if (contentImage && !isPlaceholderImage(contentImage)) {
    const isHeic =
      contentImage.toLowerCase().endsWith('.heic') ||
      contentImage.toLowerCase().endsWith('.heif')
    if (!isHeic) {
      const absolute = toAbsoluteSocialImageUrl(contentImage)
      if (absolute) return absolute
    }
  }

  if (orgOgImage && !isPlaceholderImage(orgOgImage)) {
    const absolute = toAbsoluteSocialImageUrl(orgOgImage)
    if (absolute) return absolute
  }

  return generateSeoImage(title, description, type)
}

export function getOptimizedImage(
  fallbackTitle: string,
  imageUrl?: string | null,
  fallbackDescription?: string,
  type: 'blog' | 'sermon' | 'event' | 'ministry' | 'product' | 'default' = 'default',
  orgOgImage?: string | null
): string {
  return resolveShareImageUrl(
    fallbackTitle,
    fallbackDescription || '',
    imageUrl,
    orgOgImage,
    type
  )
}

export function createSocialImageMetadata(
  title: string,
  description: string,
  imageUrl?: string | null,
  type: 'blog' | 'sermon' | 'event' | 'ministry' | 'product' | 'default' = 'default',
  orgOgImage?: string | null
) {
  const optimizedImage = resolveShareImageUrl(
    title,
    description,
    imageUrl,
    orgOgImage,
    type
  )

  return {
    url: optimizedImage,
    width: 1200,
    height: 630,
    alt: title,
    type: 'image/jpeg' as const,
  }
}
