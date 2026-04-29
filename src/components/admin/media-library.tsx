'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import {
  FileText,
  Music,
  Video,
  File,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadZone } from '@/components/admin/upload-zone'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { deleteMedia } from '@/lib/actions/media'
import { createClient } from '@/lib/supabase/client'
import type { MediaAsset } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterType = 'all' | 'image' | 'audio' | 'video' | 'document'

interface MediaLibraryProps {
  initialMedia: MediaAsset[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function TypeIcon({ type }: { type: MediaAsset['type'] }) {
  switch (type) {
    case 'audio':
      return <Music className="size-10 text-muted-foreground" />
    case 'video':
      return <Video className="size-10 text-muted-foreground" />
    case 'document':
      return <FileText className="size-10 text-muted-foreground" />
    default:
      return <File className="size-10 text-muted-foreground" />
  }
}

// ---------------------------------------------------------------------------
// MediaCard
// ---------------------------------------------------------------------------

interface MediaCardProps {
  asset: MediaAsset
  onDelete: (id: string) => void
}

function MediaCard({ asset, onDelete }: MediaCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleConfirmDelete() {
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteMedia(asset.id)
    setDeleting(false)
    if ('error' in result) {
      setDeleteError(result.error)
    } else {
      setConfirmOpen(false)
      onDelete(asset.id)
    }
  }

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
        {/* Thumbnail */}
        <div className="relative flex h-36 items-center justify-center bg-muted">
          {asset.type === 'image' ? (
            <Image
              src={asset.url}
              alt={asset.alt_text ?? asset.filename}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <TypeIcon type={asset.type} />
          )}

          {/* Delete button overlay */}
          <button
            type="button"
            aria-label={`Delete ${asset.filename}`}
            onClick={() => setConfirmOpen(true)}
            className="absolute right-2 top-2 rounded-md bg-background/80 p-1.5 text-destructive opacity-0 transition-opacity hover:bg-background group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-0.5 p-2">
          <p
            className="truncate text-xs font-medium text-foreground"
            title={asset.filename}
          >
            {asset.filename}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(asset.size_bytes)}
          </p>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete media asset?</DialogTitle>
            <DialogDescription>
              &ldquo;{asset.filename}&rdquo; will be permanently removed from
              storage and cannot be recovered.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}

          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={deleting}>
                  Cancel
                </Button>
              }
            />
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleConfirmDelete}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// MediaGrid
// ---------------------------------------------------------------------------

interface MediaGridProps {
  assets: MediaAsset[]
  onDelete: (id: string) => void
}

function MediaGrid({ assets, onDelete }: MediaGridProps) {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <File className="mb-3 size-10 opacity-40" />
        <p className="text-sm">No media assets found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {assets.map((asset) => (
        <MediaCard key={asset.id} asset={asset} onDelete={onDelete} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter tabs config
// ---------------------------------------------------------------------------

const FILTER_TABS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Images', value: 'image' },
  { label: 'Audio', value: 'audio' },
  { label: 'Video', value: 'video' },
  { label: 'Documents', value: 'document' },
]

// ---------------------------------------------------------------------------
// MediaLibrary (main Client Component)
// ---------------------------------------------------------------------------

export function MediaLibrary({ initialMedia }: MediaLibraryProps) {
  const [media, setMedia] = useState<MediaAsset[]>(initialMedia)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [uploadOpen, setUploadOpen] = useState(false)

  // Re-fetch media list from Supabase using the browser client
  const refreshMedia = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[MediaLibrary] refresh error', error.message)
      return
    }
    setMedia(data ?? [])
  }, [])

  function handleUploadComplete() {
    refreshMedia()
  }

  function handleDelete(id: string) {
    setMedia((prev) => prev.filter((a) => a.id !== id))
  }

  const filtered =
    activeFilter === 'all'
      ? media
      : media.filter((a) => a.type === activeFilter)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Media Library</h1>
        <Button
          variant={uploadOpen ? 'outline' : 'default'}
          size="sm"
          onClick={() => setUploadOpen((v) => !v)}
        >
          {uploadOpen ? (
            <>
              <X className="mr-1.5 size-4" />
              Close
            </>
          ) : (
            <>
              <Upload className="mr-1.5 size-4" />
              Upload
            </>
          )}
        </Button>
      </div>

      {/* Upload zone (collapsible) */}
      {uploadOpen && (
        <UploadZone
          onUploadComplete={handleUploadComplete}
          className="rounded-lg border border-border bg-muted/30 p-4"
        />
      )}

      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filter media by type"
        className="flex gap-1 border-b border-border"
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeFilter === tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeFilter === tab.value
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Media grid */}
      <MediaGrid assets={filtered} onDelete={handleDelete} />
    </div>
  )
}
