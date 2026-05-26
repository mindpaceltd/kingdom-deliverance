'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  UploadCloud,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createMediaRecord } from '@/lib/actions/media'
import { createGalleryItemsBulk } from '@/lib/actions/gallery'
import { titleFromFilename } from '@/lib/gallery-caption'
import { uploadFileWithProgress } from '@/lib/storage/upload-with-progress'
import { validateFileSize } from '@/lib/utils'
import { cn } from '@/lib/utils'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_CONCURRENT = 2

type ItemStatus =
  | 'queued'
  | 'uploading'
  | 'saving'
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
  const [phase, setPhase] = React.useState<'idle' | 'uploading' | 'gallery' | 'finished'>(
    'idle'
  )
  const [galleryError, setGalleryError] = React.useState<string | null>(null)
  const runningRef = React.useRef(false)

  const updateItem = React.useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
    },
    []
  )

  const previewUrlsRef = React.useRef<Set<string>>(new Set())

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
  const totalProgress =
    items.length > 0
      ? Math.round(
          items.reduce((sum, it) => sum + it.progress, 0) / items.length
        )
      : 0

  async function uploadOne(item: UploadItem) {
    updateItem(item.id, { status: 'uploading', progress: 0 })

    try {
      const result = await uploadFileWithProgress(
        item.file,
        (pct) => updateItem(item.id, { progress: pct }),
        { bucket: 'media' }
      )

      updateItem(item.id, { status: 'saving', progress: 96 })

      const media = await createMediaRecord({
        filename: item.file.name,
        url: result.publicUrl,
        type: 'image',
        mime_type: item.file.type,
        size_bytes: item.file.size,
        bucket: 'media',
      })

      if ('error' in media) {
        throw new Error(media.error)
      }

      updateItem(item.id, {
        status: 'done',
        progress: 100,
        publicUrl: result.publicUrl,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      updateItem(item.id, { status: 'error', progress: 0, error: msg })
    }
  }

  async function runUploadQueue(newItems: UploadItem[]) {
    if (runningRef.current) return
    runningRef.current = true
    setPhase('uploading')
    setGalleryError(null)

    const queue = [...newItems]
    let index = 0

    async function worker() {
      while (index < queue.length) {
        const current = queue[index++]
        if (current.status === 'queued') {
          await uploadOne(current)
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(MAX_CONCURRENT, queue.length) }, () => worker())
    )

    runningRef.current = false

    setItems((current) => {
      const ready = current.filter((it) => it.status === 'done' && it.publicUrl)
      const stillQueued = current.some(
        (it) => it.status === 'queued' || it.status === 'uploading' || it.status === 'saving'
      )
      if (ready.length > 0 && !stillQueued) {
        void saveToGallery(ready)
      } else if (!stillQueued && ready.length === 0) {
        setPhase('idle')
      }
      return current
    })
  }

  async function saveToGallery(ready: UploadItem[]) {
    setPhase('gallery')
    const entries = ready.map((it) => ({
      url: it.publicUrl!,
      title: titleFromFilename(it.file.name),
    }))

    const result = await createGalleryItemsBulk(entries, 'General')
    if ('error' in result) {
      setGalleryError(result.error)
      setPhase('uploading')
      return
    }

    setItems((prev) =>
      prev.map((it) =>
        it.status === 'done' ? { ...it, status: 'added' as const } : it
      )
    )
    setPhase('finished')
  }

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => IMAGE_TYPES.includes(f.type))
    if (list.length === 0) {
      alert('Please choose JPEG, PNG, WebP, or GIF images.')
      return
    }

    const newItems: UploadItem[] = []
    for (const file of list) {
      if (!validateFileSize(file.size)) {
      const previewUrl = URL.createObjectURL(file)
      trackPreview(previewUrl)
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
      const previewUrl = URL.createObjectURL(file)
      trackPreview(previewUrl)
      newItems.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
        progress: 0,
        status: 'queued',
      })
    }

    setItems((prev) => [...prev, ...newItems])
    const toUpload = newItems.filter((it) => it.status === 'queued')
    if (toUpload.length > 0) {
      void runUploadQueue(toUpload)
    }
  }

  function clearAll() {
    revokeAllPreviews()
    setItems([])
    setPhase('idle')
    setGalleryError(null)
    runningRef.current = false
  }

  function handleFinished() {
    clearAll()
    onComplete()
  }

  const statusLabel: Record<ItemStatus, string> = {
    queued: 'Waiting…',
    uploading: 'Uploading…',
    saving: 'Saving…',
    done: 'Uploaded',
    added: 'In gallery',
    error: 'Failed',
  }

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
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <UploadCloud className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Click or drag images here</p>
          <p className="text-xs text-muted-foreground">
            Select multiple files — progress and previews appear below
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
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {phase === 'gallery'
                ? 'Adding to gallery…'
                : `Uploading ${doneCount + errorCount} of ${items.length}`}
            </span>
            <span className="text-muted-foreground">{totalProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          {errorCount > 0 && (
            <p className="text-xs text-destructive">
              {errorCount} file{errorCount !== 1 ? 's' : ''} failed
            </p>
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
                  src={item.previewUrl}
                  alt={item.file.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {(item.status === 'uploading' || item.status === 'saving') && (
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
                    'text-[10px]',
                    item.status === 'error'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
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
          <p className="text-xs text-green-900/80 dark:text-green-200/80">
            Preview your uploads below. They are now live on the public gallery page.
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items
              .filter((it) => it.status === 'added' && it.publicUrl)
              .map((item) => (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-md border border-green-200/60 bg-white dark:bg-background"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={item.publicUrl || item.previewUrl}
                      alt={item.file.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="truncate px-2 py-1 text-[10px] font-medium">
                    {titleFromFilename(item.file.name) || item.file.name}
                  </p>
                </li>
              ))}
          </ul>
          <Button type="button" onClick={handleFinished} className="w-full sm:w-auto">
            Done — view gallery
          </Button>
        </div>
      )}
    </div>
  )
}
