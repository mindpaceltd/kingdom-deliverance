'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { Trash2, Upload, X, Copy, Check, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  bulkDeleteMedia,
  deleteMedia,
  getMediaLibraryPage,
  updateMedia,
} from '@/lib/actions/media'
import type { MediaLibraryFilter } from '@/lib/media/library-query'
import { LazyMediaThumb } from '@/components/admin/media/lazy-media-thumb'
import { MediaFilePreview } from '@/components/admin/media/media-file-preview'
import { MediaLibrarySkeleton } from '@/components/admin/media/media-library-skeleton'
import {
  getClientLibraryCache,
  invalidateClientLibraryCache,
  setClientLibraryCache,
} from '@/lib/media/library-client-cache'
import type { MediaAsset } from '@/lib/types'
import { cn } from '@/lib/utils'

const UploadZone = dynamic(
  () => import('@/components/admin/upload-zone').then((m) => ({ default: m.UploadZone })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

interface MediaLibraryProps {
  initialMedia: MediaAsset[]
  initialTotal: number
  initialHasMore: boolean
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const FILTERS: MediaLibraryFilter[] = ['all', 'image', 'audio', 'video', 'document']

export function MediaLibrary({
  initialMedia,
  initialTotal,
  initialHasMore,
}: MediaLibraryProps) {
  const [media, setMedia] = React.useState<MediaAsset[]>(initialMedia)
  const [total, setTotal] = React.useState(initialTotal)
  const [hasMore, setHasMore] = React.useState(initialHasMore)
  const [page, setPage] = React.useState(0)
  const [activeFilter, setActiveFilter] = React.useState<MediaLibraryFilter>('all')
  const [filterLoading, setFilterLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [selectedAsset, setSelectedAsset] = React.useState<MediaAsset | null>(null)

  const [editForm, setEditForm] = React.useState({
    filename: '',
    alt_text: '',
    caption: '',
  })
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [searchInput, setSearchInput] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = React.useState(false)

  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  React.useEffect(() => {
    if (selectedAsset) {
      setEditForm({
        filename: selectedAsset.filename || '',
        alt_text: selectedAsset.alt_text || '',
        caption: selectedAsset.caption || '',
      })
      setCopied(false)
    }
  }, [selectedAsset])

  const fetchPage = React.useCallback(
    async (
      pageIndex: number,
      filter: MediaLibraryFilter,
      append: boolean,
      search: string
    ) => {
      if (!append) {
        const cached = getClientLibraryCache(pageIndex, filter, search)
        if (cached) {
          setMedia(cached.data)
          setTotal(cached.total)
          setHasMore(cached.hasMore)
          setPage(pageIndex)
          return cached
        }
      }

      const result = await getMediaLibraryPage({
        page: pageIndex,
        type: filter,
        search: search || undefined,
      })
      if ('error' in result) {
        alert(result.error)
        return null
      }

      if (!append) {
        setClientLibraryCache(pageIndex, filter, result, search)
      }

      if (append) {
        setMedia((prev) => {
          const seen = new Set(prev.map((a) => a.id))
          const next = result.data.filter((a) => !seen.has(a.id))
          return [...prev, ...next]
        })
      } else {
        setMedia(result.data)
      }
      setTotal(result.total)
      setHasMore(result.hasMore)
      setPage(pageIndex)
      return result
    },
    []
  )

  async function handleFilterChange(filter: MediaLibraryFilter) {
    if (filter === activeFilter) return
    setActiveFilter(filter)
    setSelectedAsset(null)

    const cached = getClientLibraryCache(0, filter, searchQuery)
    if (cached) {
      setMedia(cached.data)
      setTotal(cached.total)
      setHasMore(cached.hasMore)
      setPage(0)
      setSelectedIds(new Set())
      return
    }

    setFilterLoading(true)
    setSelectedIds(new Set())
    await fetchPage(0, filter, false, searchQuery)
    setFilterLoading(false)
  }

  const searchMountedRef = React.useRef(false)
  React.useEffect(() => {
    if (!searchMountedRef.current) {
      searchMountedRef.current = true
      return
    }
    setFilterLoading(true)
    setSelectedIds(new Set())
    setSelectedAsset(null)
    void fetchPage(0, activeFilter, false, searchQuery).finally(() => setFilterLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const loadMoreStateRef = React.useRef({
    hasMore,
    loadingMore,
    filterLoading,
    page,
    activeFilter,
    searchQuery,
  })
  loadMoreStateRef.current = {
    hasMore,
    loadingMore,
    filterLoading,
    page,
    activeFilter,
    searchQuery,
  }

  const handleLoadMore = React.useCallback(async () => {
    const s = loadMoreStateRef.current
    if (!s.hasMore || s.loadingMore || s.filterLoading) return
    setLoadingMore(true)
    await fetchPage(s.page + 1, s.activeFilter, true, s.searchQuery)
    setLoadingMore(false)
  }, [fetchPage])

  React.useEffect(() => {
    const sentinel = loadMoreRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void handleLoadMore()
      },
      { rootMargin: '280px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleLoadMore, hasMore])

  async function refreshAfterUpload() {
    invalidateClientLibraryCache()
    await fetchPage(0, activeFilter, false, searchQuery)
    setUploadOpen(false)
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllOnPage() {
    setSelectedIds(new Set(media.map((a) => a.id)))
  }

  async function handleBulkDelete() {
    const count = selectedIds.size
    if (
      count === 0 ||
      !window.confirm(`Permanently delete ${count} selected file${count === 1 ? '' : 's'}?`)
    ) {
      return
    }
    setBulkDeleting(true)
    const result = await bulkDeleteMedia([...selectedIds])
    setBulkDeleting(false)
    if ('error' in result) {
      alert(result.error)
      return
    }
    invalidateClientLibraryCache()
    setSelectedIds(new Set())
    if (selectedAsset && selectedIds.has(selectedAsset.id)) {
      setSelectedAsset(null)
    }
    await fetchPage(0, activeFilter, false, searchQuery)
    if (result.failed > 0) {
      alert(`Deleted ${result.deleted} file(s). ${result.failed} could not be deleted.`)
    }
  }

  async function handleSaveMetadata() {
    if (!selectedAsset) return
    setSaving(true)
    const result = await updateMedia(selectedAsset.id, editForm)
    setSaving(false)
    if ('success' in result) {
      setMedia((prev) =>
        prev.map((a) => (a.id === selectedAsset.id ? { ...a, ...editForm } : a))
      )
      setSelectedAsset((prev) => (prev ? { ...prev, ...editForm } : null))
    } else {
      alert(result.error)
    }
  }

  async function handleDelete() {
    if (!selectedAsset || !window.confirm('Are you sure you want to delete this media?')) return
    setDeleting(true)
    const result = await deleteMedia(selectedAsset.id)
    setDeleting(false)
    if ('success' in result) {
      invalidateClientLibraryCache()
      setMedia((prev) => prev.filter((a) => a.id !== selectedAsset.id))
      setTotal((t) => Math.max(0, t - 1))
      setSelectedAsset(null)
    } else {
      alert(result.error)
    }
  }

  function copyUrl() {
    if (!selectedAsset) return
    navigator.clipboard.writeText(selectedAsset.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showingCount = media.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Media Library</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total > 0
              ? `Showing ${showingCount} of ${total} files — images load as you scroll.`
              : 'Manage your images, videos, and documents.'}
          </p>
        </div>
        <Button
          variant={uploadOpen ? 'outline' : 'default'}
          size="sm"
          onClick={() => setUploadOpen((v) => !v)}
        >
          {uploadOpen ? <X className="mr-2 size-4" /> : <Upload className="mr-2 size-4" />}
          {uploadOpen ? 'Close' : 'Add New'}
        </Button>
      </div>

      {uploadOpen && (
        <UploadZone
          onUploadComplete={refreshAfterUpload}
          className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 transition-colors hover:bg-muted/30"
        />
      )}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search filename, alt text, or caption…"
          className="pl-9"
          aria-label="Search media library"
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button variant="ghost" size="sm" className="h-8" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={selectAllOnPage}>
            Select all on page
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8"
            disabled={bulkDeleting}
            onClick={handleBulkDelete}
          >
            {bulkDeleting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 size-4" /> Delete selected
              </>
            )}
          </Button>
        </div>
      )}

      <div className="flex gap-1 border-b border-border">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => handleFilterChange(filter)}
            disabled={filterLoading}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors',
              activeFilter === filter
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
              filterLoading && 'opacity-60'
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {filterLoading ? (
        <MediaLibrarySkeleton count={18} />
      ) : media.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          {searchQuery
            ? `No files match "${searchQuery}".`
            : `No ${activeFilter === 'all' ? '' : `${activeFilter} `}files yet.`}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {media.map((asset) => (
              <LazyMediaThumb
                key={asset.id}
                asset={asset}
                selected={selectedAsset?.id === asset.id}
                checked={selectedIds.has(asset.id)}
                onSelect={() => setSelectedAsset(asset)}
                onToggleCheck={() => toggleSelected(asset.id)}
              />
            ))}
          </div>

          <div ref={loadMoreRef} className="flex min-h-12 items-center justify-center py-4">
            {loadingMore && (
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading more" />
            )}
            {hasMore && !loadingMore && (
              <Button variant="outline" size="sm" onClick={handleLoadMore}>
                Load more
              </Button>
            )}
            {!hasMore && showingCount > 0 && (
              <p className="text-xs text-muted-foreground">All files loaded</p>
            )}
          </div>
        </>
      )}

      <Sheet open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <SheetContent className="w-full overflow-y-auto px-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-6 pb-4">
            <SheetTitle>Attachment Details</SheetTitle>
          </SheetHeader>

          {selectedAsset && (
            <div className="flex flex-col">
              <div className="flex min-h-[240px] items-center justify-center border-b border-border bg-muted/30 p-6">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-white shadow-sm dark:bg-muted">
                  <MediaFilePreview
                    asset={selectedAsset}
                    active
                    variant="detail"
                    className="min-h-[200px]"
                  />
                </div>
              </div>

              <div className="space-y-6 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium uppercase">
                      {selectedAsset.mime_type?.split('/')[1] || selectedAsset.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">File Size</p>
                    <p className="font-medium">{formatBytes(selectedAsset.size_bytes)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uploaded On</p>
                    <p className="font-medium">
                      {new Date(selectedAsset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ID</p>
                    <p className="truncate font-medium" title={selectedAsset.id}>
                      ...{selectedAsset.id.slice(-8)}
                    </p>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="h-8 w-full gap-2" onClick={copyUrl}>
                  {copied ? (
                    <Check className="size-3.5 text-green-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy Public URL'}
                </Button>

                <div className="space-y-4 border-t border-border pt-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Alt Text
                    </Label>
                    <Input
                      value={editForm.alt_text}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, alt_text: e.target.value }))
                      }
                      placeholder="Describe the image for SEO..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Title / Filename
                    </Label>
                    <Input
                      value={editForm.filename}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, filename: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Caption
                    </Label>
                    <Textarea
                      value={editForm.caption}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, caption: e.target.value }))
                      }
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border bg-background p-4 sm:p-6">
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? (
                    'Deleting...'
                  ) : (
                    <>
                      <Trash2 className="mr-2 size-4" /> Delete Permanently
                    </>
                  )}
                </Button>
                <Button size="sm" onClick={handleSaveMetadata} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
