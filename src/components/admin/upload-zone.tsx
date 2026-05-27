'use client'

import * as React from 'react'
import { useRef, useState, useCallback } from 'react'
import { UploadCloud, X, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createMediaRecord } from '@/lib/actions/media'
import { MediaUrlPreview } from '@/components/admin/media/media-url-preview'
import { inferMediaTypeFromFile } from '@/lib/media/media-preview'
import { validateFileSize } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/mp4',
  'video/mp4',
  'application/pdf',
]

const ACCEPT_STRING = ACCEPTED_MIME_TYPES.join(',')

function isImageFile(file: File): boolean {
  return inferMediaTypeFromFile(file) === 'image'
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UploadZoneProps {
  onUploadComplete?: (url: string) => void
  /** Called once when every file in the current batch has finished (success or error). */
  onBatchComplete?: (items: { url: string; filename: string }[]) => void
  onUploadError?: (error: string) => void
  accept?: string
  className?: string
  hint?: string
}

interface FileUploadState {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  url?: string
}

// ---------------------------------------------------------------------------
// UploadZone
// ---------------------------------------------------------------------------

export function UploadZone({
  onUploadComplete,
  onBatchComplete,
  onUploadError,
  accept = ACCEPT_STRING,
  className,
  hint,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<FileUploadState[]>([])
  const batchNotifiedRef = useRef(false)
  const objectUrlsRef = useRef<Map<number, string>>(new Map())

  React.useEffect(() => {
    const urls = objectUrlsRef.current
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
      urls.clear()
    }
  }, [])

  // ── Validation ────────────────────────────────────────────────────────────

  function validateFile(file: File): string | null {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return `"${file.name}" has an unsupported file type (${file.type}).`
    }
    if (!validateFileSize(file.size)) {
      return `"${file.name}" exceeds the 50 MB size limit.`
    }
    return null
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  const uploadFile = useCallback(
    async (file: File, index: number) => {
      const supabase = createClient()
      const type = inferMediaTypeFromFile(file)

      setUploads((prev) =>
        prev.map((u, i) =>
          i === index ? { ...u, status: 'uploading' } : u
        )
      )

      let publicUrl: string
      try {
        const { uploadFileViaApi } = await import('@/lib/storage/client-upload')
        const result = await uploadFileViaApi(file, { bucket: 'media' })
        publicUrl = result.publicUrl
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Cloudflare R2 upload failed'
        setUploads((prev) =>
          prev.map((u, i) =>
            i === index ? { ...u, status: 'error', error: msg } : u
          )
        )
        onUploadError?.(msg)
        return
      }

      // 3. Create media record in DB
      const result = await createMediaRecord({
        filename: file.name,
        url: publicUrl,
        type,
        mime_type: file.type,
        size_bytes: file.size,
        bucket: 'media',
      })

      if ('error' in result) {
        setUploads((prev) =>
          prev.map((u, i) =>
            i === index ? { ...u, status: 'error', error: result.error } : u
          )
        )
        onUploadError?.(result.error)
        return
      }

      setUploads((prev) =>
        prev.map((u, i) =>
          i === index ? { ...u, status: 'done', url: publicUrl } : u
        )
      )
      if (!onBatchComplete) {
        onUploadComplete?.(publicUrl)
      }
    },
    [onUploadComplete, onBatchComplete, onUploadError]
  )

  React.useEffect(() => {
    if (!onBatchComplete || uploads.length === 0) {
      batchNotifiedRef.current = false
      return
    }
    const inFlight = uploads.some(
      (u) => u.status === 'pending' || u.status === 'uploading'
    )
    if (inFlight) return
    const items = uploads
      .filter((u) => u.status === 'done' && u.url)
      .map((u) => ({ url: u.url as string, filename: u.file.name }))
    if (items.length === 0 || batchNotifiedRef.current) return
    batchNotifiedRef.current = true
    onBatchComplete(items)
  }, [uploads, onBatchComplete])

  // ── File processing ───────────────────────────────────────────────────────

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      batchNotifiedRef.current = false
      const fileArray = Array.from(files)
      const newUploads: FileUploadState[] = fileArray.map((file) => {
        const error = validateFile(file)
        return { file, status: error ? 'error' : 'pending', error: error ?? undefined }
      })

      setUploads((prev) => {
        const startIndex = prev.length
        // Kick off uploads for valid files
        newUploads.forEach((u, i) => {
          if (u.status === 'pending') {
            uploadFile(u.file, startIndex + i)
          }
        })
        return [...prev, ...newUploads]
      })
    },
    [uploadFile]
  )

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      // Reset input so the same file can be re-selected
      e.target.value = ''
    }
  }

  function removeUpload(index: number) {
    const blobUrl = objectUrlsRef.current.get(index)
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl)
      objectUrlsRef.current.delete(index)
    }
    setUploads((prev) => prev.filter((_, i) => i !== index))
  }

  function previewUrlForUpload(upload: FileUploadState, index: number): string | null {
    if (upload.status === 'done' && upload.url) return upload.url
    if (!isImageFile(upload.file)) return null
    let blob = objectUrlsRef.current.get(index)
    if (!blob) {
      blob = URL.createObjectURL(upload.file)
      objectUrlsRef.current.set(index, blob)
    }
    return blob
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files — click or drag and drop"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <UploadCloud className="size-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Click to upload or drag and drop
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hint ?? 'Images, audio, video, PDF — max 50 MB each. Hold Shift or Cmd to select many files.'}
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleInputChange}
      />

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <ul className="space-y-2" aria-label="Upload progress">
          {uploads.map((upload, i) => {
            const thumbUrl = previewUrlForUpload(upload, i)
            return (
            <li
              key={i}
              className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              {thumbUrl ? (
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                  {upload.status === 'done' && upload.url ? (
                    <MediaUrlPreview url={upload.url} alt="" className="absolute inset-0" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>
              ) : null}
              {/* Status icon */}
              {upload.status === 'uploading' && (
                <div className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
              {upload.status === 'done' && (
                <CheckCircle className="size-4 shrink-0 text-green-600" />
              )}
              {upload.status === 'error' && (
                <AlertCircle className="size-4 shrink-0 text-destructive" />
              )}
              {upload.status === 'pending' && (
                <div className="size-4 shrink-0 rounded-full border-2 border-muted-foreground" />
              )}

              {/* Filename + error */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {upload.file.name}
                </p>
                {upload.error && (
                  <p className="text-xs text-destructive">{upload.error}</p>
                )}
                {upload.status === 'uploading' && (
                  <p className="text-xs text-muted-foreground">Uploading…</p>
                )}
                {upload.status === 'done' && (
                  <p className="text-xs text-green-600">Upload complete</p>
                )}
              </div>

              {/* Remove button */}
              {(upload.status === 'done' || upload.status === 'error') && (
                <button
                  type="button"
                  onClick={() => removeUpload(i)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${upload.file.name}`}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          )})}
        </ul>
      )}
    </div>
  )
}
