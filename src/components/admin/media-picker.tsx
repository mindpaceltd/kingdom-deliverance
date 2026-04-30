'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { createMediaRecord } from '@/lib/actions/media'
import type { MediaAsset } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ImageIcon,
  FileAudioIcon,
  FileVideoIcon,
  FileTextIcon,
  UploadIcon,
  FolderOpenIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterTab = 'all' | 'image' | 'audio' | 'video' | 'document'

interface MediaPickerProps {
  value?: string
  onSelect: (url: string) => void
  label?: string
  accept?: 'image' | 'all'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'image', label: 'Images' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
  { key: 'document', label: 'Documents' },
]

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ---------------------------------------------------------------------------
// MediaCard
// ---------------------------------------------------------------------------

function MediaCard({ asset, onSelect }: { asset: MediaAsset; onSelect: (url: string) => void }) {
  const isImage = asset.type === 'image'
  return (
    <button
      type="button"
      onClick={() => onSelect(asset.url)}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-muted/30 text-left transition-colors hover:border-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={asset.alt_text ?? asset.filename}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {isImage ? (
          <Image
            src={asset.url}
            alt={asset.alt_text ?? asset.filename}
            fill
            sizes="(max-width: 640px) 50vw, 20vw"
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <AssetTypeIcon type={asset.type} className="size-10 opacity-60" />
          </div>
        )}
      </div>
      <div className="px-2 py-1.5">
        <p className="truncate text-xs font-medium leading-tight text-foreground">{asset.filename}</p>
        {asset.size_bytes && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{formatBytes(asset.size_bytes)}</p>
        )}
      </div>
    </button>
  )
}

function AssetTypeIcon({ type, className }: { type: MediaAsset['type']; className?: string }) {
  switch (type) {
    case 'image': return <ImageIcon className={className} />
    case 'audio': return <FileAudioIcon className={className} />
    case 'video': return <FileVideoIcon className={className} />
    default: return <FileTextIcon className={className} />
  }
}

// ---------------------------------------------------------------------------
// MediaPickerModal
// ---------------------------------------------------------------------------

function MediaPickerModal({
  accept,
  onSelect,
  onClose,
}: {
  accept?: 'image' | 'all'
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>(accept === 'image' ? 'image' : 'all')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<
    | { status: 'idle' }
    | { status: 'uploading'; filename: string; progress: number }
    | { status: 'success'; filename: string }
    | { status: 'error'; message: string }
  >({ status: 'idle' })

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setAssets(data as MediaAsset[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  async function uploadSelectedFile(file: File) {
    setUploadState({ status: 'uploading', filename: file.name, progress: 0 })

    const supabase = createClient()

    // Check auth session first
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setUploadState({ status: 'error', message: 'You must be logged in to upload files.' })
      return
    }

    const type = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('audio/')
        ? 'audio'
        : file.type.startsWith('video/')
          ? 'video'
          : 'document'

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${type}/${Date.now()}-${safeName}`

    setUploadState({ status: 'uploading', filename: file.name, progress: 30 })

    const { error: storageError } = await supabase.storage
      .from('media')
      .upload(path, file, { upsert: false })

    if (storageError) {
      console.error('[upload] storage error:', storageError)
      setUploadState({
        status: 'error',
        message: `Upload failed: ${storageError.message}`,
      })
      return
    }

    setUploadState({ status: 'uploading', filename: file.name, progress: 70 })

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)

    const result = await createMediaRecord({
      filename: file.name,
      url: urlData.publicUrl,
      type,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      bucket: 'media',
    })

    if ('error' in result) {
      // Storage upload succeeded but DB record failed — still show the image
      console.error('[upload] createMediaRecord error:', result.error)
      setUploadState({
        status: 'error',
        message: `File uploaded but record failed: ${result.error}`,
      })
      // Still refresh to show the file if it somehow got recorded
      await fetchAssets()
      return
    }

    setUploadState({ status: 'success', filename: file.name })
    await fetchAssets()
    // Auto-clear success after 3s
    setTimeout(() => setUploadState({ status: 'idle' }), 3000)
  }

  const visibleAssets = assets.filter((a) =>
    activeTab === 'all' ? true : a.type === activeTab
  )

  const tabs = accept === 'image'
    ? FILTER_TABS.filter((t) => t.key === 'all' || t.key === 'image')
    : FILTER_TABS

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading…' : `${visibleAssets.length} file${visibleAssets.length !== 1 ? 's' : ''}`}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploadState.status === 'uploading'}
          onClick={() => fileInputRef.current?.click()}
          className="gap-1.5"
        >
          <UploadIcon className="size-3.5" />
          {uploadState.status === 'uploading' ? 'Uploading…' : 'Upload File'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept === 'image' ? 'image/*' : undefined}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) await uploadSelectedFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Upload status banner */}
      {uploadState.status === 'uploading' && (
        <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-primary">
          <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
          <span>Uploading <strong>{uploadState.filename}</strong>…</span>
          <span className="ml-auto text-xs">{uploadState.progress}%</span>
        </div>
      )}
      {uploadState.status === 'success' && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          <CheckCircleIcon className="size-4 shrink-0" />
          <span><strong>{uploadState.filename}</strong> uploaded successfully.</span>
        </div>
      )}
      {uploadState.status === 'error' && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircleIcon className="size-4 shrink-0" />
          <span>{uploadState.message}</span>
          <button
            type="button"
            className="ml-auto text-xs underline"
            onClick={() => setUploadState({ status: 'idle' })}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div role="tablist" className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm">Loading media…</span>
          </div>
        </div>
      ) : visibleAssets.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-muted-foreground">
          <FolderOpenIcon className="size-10 opacity-40" />
          <p className="text-sm">No files found.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <UploadIcon className="size-3.5" />
            Upload your first file
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 max-h-[400px] overflow-y-auto pr-1">
          {visibleAssets.map((asset) => (
            <MediaCard
              key={asset.id}
              asset={asset}
              onSelect={(url) => { onSelect(url); onClose() }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MediaPicker (trigger + dialog)
// ---------------------------------------------------------------------------

export function MediaPicker({
  value,
  onSelect,
  label = 'Select Media',
  accept = 'all',
}: MediaPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        {value && (
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            <Image src={value} alt="Selected" fill sizes="40px" className="object-cover" unoptimized />
          </div>
        )}
        <DialogTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <ImageIcon className="size-4" />
              {label}
            </Button>
          }
        />
      </div>

      <DialogContent className="sm:max-w-3xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        <MediaPickerModal
          accept={accept}
          onSelect={onSelect}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
