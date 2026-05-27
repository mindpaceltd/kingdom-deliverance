import type { MediaAsset } from '@/lib/types'
import { getMediaProxyUrl, normalizeMediaUrl } from '@/lib/media-url'

export type MediaDisplayKind = 'image' | 'pdf' | 'video' | 'audio' | 'document'

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|avif|bmp|ico|heic|heif)(\?|#|$)/i

export function inferMediaTypeFromFile(file: {
  type: string
  name: string
}): MediaAsset['type'] {
  const mime = (file.type ?? '').toLowerCase()
  const name = (file.name ?? '').toLowerCase()

  if (mime.startsWith('image/') || IMAGE_EXT.test(name)) return 'image'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  return 'document'
}

export function resolveMediaDisplayKind(asset: MediaAsset): MediaDisplayKind {
  const mime = (asset.mime_type ?? '').toLowerCase()
  const name = (asset.filename ?? '').toLowerCase()
  const url = (asset.url ?? '').toLowerCase()

  if (
    mime.startsWith('image/') ||
    asset.type === 'image' ||
    IMAGE_EXT.test(name) ||
    IMAGE_EXT.test(url)
  ) {
    return 'image'
  }

  if (mime === 'application/pdf' || name.endsWith('.pdf') || url.endsWith('.pdf')) {
    return 'pdf'
  }

  if (mime.startsWith('video/') || asset.type === 'video') {
    return 'video'
  }

  if (mime.startsWith('audio/') || asset.type === 'audio') {
    return 'audio'
  }

  return 'document'
}

/** Direct public CDN URL (preferred for <img> thumbnails). */
export function getMediaDirectUrl(asset: MediaAsset): string {
  return normalizeMediaUrl(asset.url) ?? asset.url ?? ''
}

/** Ordered fallbacks for image thumbnails: CDN first, then same-origin proxy. */
export function getMediaImageSourcesFromUrl(url: string): string[] {
  const direct = normalizeMediaUrl(url) ?? url
  const proxy = getMediaProxyUrl(url)
  const out: string[] = []
  if (direct.trim()) out.push(direct)
  if (proxy && !out.includes(proxy)) out.push(proxy)
  return out
}

export function getMediaImageSources(asset: MediaAsset): string[] {
  return getMediaImageSourcesFromUrl(asset.url)
}

/** Public or same-origin URL suitable for previews (embeds, video, img). */
export function getMediaPreviewUrl(asset: MediaAsset): string {
  const sources = getMediaImageSources(asset)
  return sources[0] ?? ''
}

export function getFileExtension(asset: MediaAsset): string {
  const fromName = asset.filename?.split('.').pop()
  if (fromName && fromName.length <= 6) return fromName.toUpperCase()
  const fromMime = asset.mime_type?.split('/').pop()
  if (fromMime) return fromMime.toUpperCase()
  return asset.type.toUpperCase()
}

export function getShortFilename(asset: MediaAsset, max = 28): string {
  const name = asset.filename || 'Untitled'
  if (name.length <= max) return name
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  const base = name.slice(0, max - ext.length - 1)
  return `${base}…${ext}`
}
