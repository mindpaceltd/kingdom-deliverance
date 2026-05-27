import type { MediaLibraryFilter, MediaLibraryPageResult } from '@/lib/media/library-query'

const TTL_MS = 90_000
const MAX_ENTRIES = 24

type Entry = { result: MediaLibraryPageResult; at: number }

const store = new Map<string, Entry>()

function cacheKey(page: number, type: MediaLibraryFilter): string {
  return `${type}:${page}`
}

export function getClientLibraryCache(
  page: number,
  type: MediaLibraryFilter
): MediaLibraryPageResult | null {
  const key = cacheKey(page, type)
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > TTL_MS) {
    store.delete(key)
    return null
  }
  return entry.result
}

export function setClientLibraryCache(
  page: number,
  type: MediaLibraryFilter,
  result: MediaLibraryPageResult
): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = [...store.entries()].sort((a, b) => a[1].at - b[1].at)[0]
    if (oldest) store.delete(oldest[0])
  }
  store.set(cacheKey(page, type), { result, at: Date.now() })
}

export function invalidateClientLibraryCache(): void {
  store.clear()
}
