import type { MediaAsset } from '@/lib/types'

export const MEDIA_LIBRARY_PAGE_SIZE = 48

export const MEDIA_LIBRARY_SELECT =
  'id, filename, url, type, mime_type, size_bytes, alt_text, caption, uploaded_by, bucket, created_at' as const

export type MediaLibraryFilter = 'all' | 'image' | 'audio' | 'video' | 'document'

export type MediaLibraryPageResult = {
  data: MediaAsset[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
