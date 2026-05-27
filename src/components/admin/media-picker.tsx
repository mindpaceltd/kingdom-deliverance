'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MediaGridTile } from '@/components/admin/media/media-grid-tile'
import { MediaUrlPreview } from '@/components/admin/media/media-url-preview'
import { createClient } from '@/lib/supabase/client'
import { inferMediaTypeFromFile } from '@/lib/media/media-preview'
import type { MediaAsset } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ImageIcon,
  UploadIcon,
  FolderOpenIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from 'lucide-react'

type FilterTab = 'all' | 'image' | 'audio' | 'video' | 'document'

interface MediaPickerProps {
  value?: string
  onSelect: (url: string) => void
  label?: string
  accept?: 'image' | 'all'
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'image', label: 'Images' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
  { key: 'document', label: 'Documents' },
]

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

  useEffect(() => {
    void fetchAssets()
  }, [fetchAssets])

  async function uploadSelectedFile(file: File) {
    setUploadState({ status: 'uploading', filename: file.name, progress: 0 })

    const supabase = createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setUploadState({ status: 'error', message: 'You must be logged in to upload files.' })
      return
    }

    const type = inferMediaTypeFromFile(file)

    setUploadState({ status: 'uploading', filename: file.name, progress: 40 })

    let publicUrl: string
    try {
      const { uploadFileViaApi } = await import('@/lib/storage/client-upload')
      const result = await uploadFileViaApi(file, { bucket: 'media' })
      publicUrl = result.publicUrl
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Storage upload failed'
      console.error('[upload] R2 error:', message)
      setUploadState({ status: 'error', message })
      return
    }

    setUploadState({ status: 'uploading', filename: file.name, progress: 80 })

    let recordError: string | null = null
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          url: publicUrl,
          type,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          bucket: 'media',
          uploaded_by: session.user.id,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        recordError = json.error ?? `HTTP ${res.status}`
      }
    } catch (e) {
      recordError = e instanceof Error ? e.message : String(e)
    }

    if (recordError) {
      console.error('[upload] record error:', recordError)
      setUploadState({
        status: 'error',
        message: `File uploaded to storage but record failed: ${recordError}`,
      })
      await fetchAssets()
      return
    }

    setUploadState({ status: 'success', filename: file.name })
    await fetchAssets()
    setTimeout(() => setUploadState({ status: 'idle' }), 3000)
  }

  const visibleAssets = assets.filter((a) =>
    activeTab === 'all' ? true : a.type === activeTab
  )

  const tabs =
    accept === 'image'
      ? FILTER_TABS.filter((t) => t.key === 'all' || t.key === 'image')
      : FILTER_TABS

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading
            ? 'Loading…'
            : `${visibleAssets.length} file${visibleAssets.length !== 1 ? 's' : ''}`}
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

      {uploadState.status === 'uploading' && (
        <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-primary">
          <div className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>
            Uploading <strong>{uploadState.filename}</strong>…
          </span>
          <span className="ml-auto text-xs">{uploadState.progress}%</span>
        </div>
      )}
      {uploadState.status === 'success' && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircleIcon className="size-4 shrink-0" />
          <span>
            <strong>{uploadState.filename}</strong> uploaded successfully.
          </span>
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

      {loading ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg bg-muted" aria-hidden>
              <div className="w-full pb-[100%] animate-pulse bg-muted-foreground/10" />
            </div>
          ))}
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
        <div className="grid max-h-[min(70vh,560px)] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {visibleAssets.map((asset) => (
            <MediaGridTile
              key={asset.id}
              asset={asset}
              metaOverlay
              onSelect={() => {
                onSelect(asset.url)
                onClose()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

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
          <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            <MediaUrlPreview url={value} alt="Selected" className="absolute inset-0" />
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

      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden sm:max-w-5xl lg:max-w-6xl"
        aria-describedby={undefined}
      >
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
