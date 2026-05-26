'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createGalleryItemsBulk } from '@/lib/actions/gallery'
import { titleFromFilename } from '@/lib/gallery-caption'
import { uploadFileWithProgress } from '@/lib/storage/upload-with-progress'
import { validateFileSize } from '@/lib/utils'
import { cn } from '@/lib/utils'

const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]
const MAX_CONCURRENT = 3

function isAllowedGalleryImage(file: File): boolean {
  if (file.type && IMAGE_TYPES.includes(file.type)) return true
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)
}

type ItemStatus =
  | 'queued'
  | 'uploading'
  | 'done'
  | 'error'
  | 'added'

interface UploadItem {
  id: string
  file: File
  previewUrl: string
  progress: number
  status: ItemStatus
  error?: string
  publicUrl?: string
}

interface GalleryBulkUploadProps {
  onComplete: () => void
}

export function GalleryBulkUpload({ onComplete }: GalleryBulkUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [items, setItems] = React.useState<UploadItem[]>([])
  const itemsRef = React.useRef<UploadItem[]>([])
  const [phase, setPhase] = React.useState<
    'idle' | 'uploading' | 'gallery' | 'finished'
  >('idle')
  const [galleryError, setGalleryError] = React.useState<string | null>(null)
  const queueRunningRef = React.useRef(false)
  const previewUrlsRef = React.useRef<Set<string>>(new Set())

  const patchItems = React.useCallback(
    (updater: (prev: UploadItem[]) => UploadItem[]) => {
      setItems((prev) => {
        const next = updater(prev)
        itemsRef.current = next
        return next
      })
    },
    []
  )

  const updateItem = React.useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      patchItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
      )
    },
    [patchItems]
  )

  function trackPreview(url: string) {
    previewUrlsRef.current.add(url)
  }

  function revokeAllPreviews() {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    previewUrlsRef.current.clear()
  }

  const doneCount = items.filter(
    (it) => it.status === 'done' || it.status === 'added'
  ).length
  const errorCount = items.filter((it) => it.status === 'error').length
  const activeCount = items.filter(
    (it) => it.status === 'queued' || it.status === 'uploading'
  ).length
  const totalProgress =
    items.length > 0
      ? Math.round(items.reduce((sum, it) => sum + it.progress, 0) / items.length)
      : 0

  async function uploadOne(item: UploadItem): Promise<UploadItem | null> {
    updateItem(item.id, { status: 'uploading', progress: 0, error: undefined })

    try {
      const result = await uploadFileWithProgress(
        item.file,
        (pct) => updateItem(item.id, { progress: pct }),
        { bucket: 'media', compress: true }
      )

      const done: UploadItem = {
        ...item,
        status: 'done',
        progress: 100,
        publicUrl: result.publicUrl,
      }
      updateItem(item.id, {
        status: 'done',
        progress: 100,
        publicUrl: result.publicUrl,
      })
      return done
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      updateItem(item.id, { status: 'error', progress: 0, error: msg })
      return null
    }
  }

  async function saveSuccessfulToGallery(successful: UploadItem[]) {
    if (successful.length === 0) return

    setPhase('gallery')
    setGalleryError(null)

    const entries = successful.map((it) => ({
      url: it.publicUrl!,
      title: titleFromFilename(it.file.name),
    }))

    const result = await createGalleryItemsBulk(entries, 'General')
    if ('error' in result) {
      setGalleryError(result.error)
      successful.forEach((it) =>
        updateItem(it.id, { status: 'error', error: result.error })
      )
      setPhase('uploading')
      return
    }

    const ids = new Set(successful.map((it) => it.id))
    patchItems((prev) =>
      prev.map((it) =>
        ids.has(it.id) ? { ...it, status: 'added' as const } : it
      )
    )
    setPhase('finished')
  }

  async function processQueued() {
    if (queueRunningRef.current) return
    queueRunningRef.current = true
    setPhase('uploading')
    setGalleryError(null)

    const completed: UploadItem[] = []

    try {
      while (itemsRef.current.some((it) => it.status === 'queued')) {
        const ids = itemsRef.current
          .filter((it) => it.status === 'queued')
          .map((it) => it.id)

        let index = 0
        const worker = async () => {
          while (index < ids.length) {
            const id = ids[index++]
            const item = itemsRef.current.find((it) => it.id === id)
            if (!item || item.status !== 'queued') continue
            const result = await uploadOne(item)
            if (result) completed.push(result)
          }
        }

        await Promise.all(
          Array.from(
            { length: Math.min(MAX_CONCURRENT, ids.length) },
            () => worker()
          )
        )
      }

      const toSave = completed.filter((it) => it.publicUrl)
      if (toSave.length > 0) {
        await saveSuccessfulToGallery(toSave)
      } else if (
        !itemsRef.current.some(
          (it) => it.status === 'queued' || it.status === 'uploading'
        )
      ) {
        setPhase(itemsRef.current.some((it) => it.status === 'error') ? 'uploading' : 'idle')
      }
    } finally {
      queueRunningRef.current = false
      if (itemsRef.current.some((it) => it.status === 'queued')) {
        void processQueued()
      }
    }
  }

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter(isAllowedGalleryImage)
    if (list.length === 0) {
      alert('Please choose JPEG, PNG, WebP, or GIF images.')
      return
    }

    const newItems: UploadItem[] = []
    for (const file of list) {
      const previewUrl = URL.createObjectURL(file)
      trackPreview(previewUrl)
      if (!validateFileSize(file.size)) {
        newItems.push({
          id: crypto.randomUUID(),
          file,
          previewUrl,
          progress: 0,
          status: 'error',
          error: 'File exceeds 50 MB limit',
        })
        continue
      }
      newItems.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
        progress: 0,
        status: 'queued',
      })
    }

    patchItems((prev) => [...prev, ...newItems])
    if (newItems.some((it) => it.status === 'queued')) void processQueued()
  }

  function retryFailed() {
    const ids = items
      .filter((it) => it.status === 'error' && validateFileSize(it.file.size))
      .map((it) => it.id)
    if (ids.length === 0) return
    patchItems((prev) =>
      prev.map((it) =>
        ids.includes(it.id)
          ? { ...it, status: 'queued' as const, progress: 0, error: undefined }
          : it
      )
    )
    void processQueued()
  }

  function clearAll() {
    revokeAllPreviews()
    setItems([])
    itemsRef.current = []
    setPhase('idle')
    setGalleryError(null)
    queueRunningRef.current = false
  }

  function handleFinished() {
    clearAll()
    onComplete()
  }

  const statusLabel: Record<ItemStatus, string> = {
    queued: 'Waiting…',
    uploading: 'Uploading…',
    done: 'Saving to gallery…',
    added: 'In gallery',
    error: 'Failed',
  }

  const isBusy =
    phase === 'uploading' || phase === 'gallery' || queueRunningRef.current

  return (
    <div className="space-y-4">
      {phase !== 'finished' && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <UploadCloud className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Click or drag images here</p>
          <p className="max-w-md text-xs text-muted-foreground">
            Large phone photos are resized automatically, then uploaded. Up to{' '}
            {MAX_CONCURRENT} at a time — watch each thumbnail below.
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {items.length > 0 && phase !== 'finished' && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">
              {phase === 'gallery'
                ? 'Adding to gallery…'
                : activeCount > 0
                  ? `Uploading ${doneCount} of ${items.length}`
                  : `${doneCount} of ${items.length} uploaded`}
            </span>
            <span className="text-muted-foreground">{totalProgress}% overall</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          {errorCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-destructive">
                {errorCount} failed — try Retry or check your connection
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retryFailed}
                disabled={isBusy}
              >
                <RotateCcw className="mr-1 size-3" />
                Retry failed
              </Button>
            </div>
          )}
          {galleryError && (
            <p className="text-xs text-destructive">{galleryError}</p>
          )}
        </div>
      )}

      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="relative aspect-square bg-muted">
                <Image
                  src={item.publicUrl || item.previewUrl}
                  alt={item.file.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="size-8 animate-spin text-white" />
                  </div>
                )}
                {item.status === 'added' && (
                  <div className="absolute right-1 top-1 rounded-full bg-green-600 p-1">
                    <CheckCircle className="size-4 text-white" />
                  </div>
                )}
                {item.status === 'error' && (
                  <div className="absolute right-1 top-1 rounded-full bg-destructive p-1">
                    <AlertCircle className="size-4 text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 p-2">
                <p className="truncate text-[10px] font-medium">{item.file.name}</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-200',
                      item.status === 'error' ? 'bg-destructive' : 'bg-primary'
                    )}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p
                  className={cn(
                    'line-clamp-2 text-[10px] leading-tight',
                    item.status === 'error'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                  title={item.error || statusLabel[item.status]}
                >
                  {item.error || statusLabel[item.status]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {phase === 'finished' && (
        <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="size-5 shrink-0" />
            <p className="text-sm font-semibold">
              {items.filter((it) => it.status === 'added').length} image
              {items.filter((it) => it.status === 'added').length !== 1 ? 's' : ''}{' '}
              added to the gallery
            </p>
          </div>
          <Button type="button" onClick={handleFinished} className="w-full sm:w-auto">
            Done — view gallery
          </Button>
        </div>
      )}
    </div>
  )
}
