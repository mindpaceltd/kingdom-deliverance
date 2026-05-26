import type { StorageUploadResult } from '@/lib/storage/client-upload'
import {
  mimeFromFilename,
  prepareImageForUpload,
} from '@/lib/storage/compress-image-for-upload'

const API_UPLOAD_MAX_BYTES = 4 * 1024 * 1024

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('timeout') ||
    msg.includes('aborted') ||
    msg.includes('err_network') ||
    msg.includes('cors')
  )
}

function xhrSend(
  url: string,
  method: string,
  body: Blob | FormData,
  headers: Record<string, string>,
  onProgress: (percent: number) => void,
  timeoutMs = 180_000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    xhr.timeout = timeoutMs
    xhr.withCredentials = false
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100)
        resolve()
      } else {
        reject(new Error(`Direct upload failed (HTTP ${xhr.status})`))
      }
    }
    xhr.onerror = () =>
      reject(
        new Error(
          'Direct storage upload blocked — use a smaller image or try again on Wi‑Fi'
        )
      )
    xhr.ontimeout = () => reject(new Error('Upload timed out — try again'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))
    xhr.send(body)
  })
}

async function uploadViaApiWithProgress(
  file: File,
  onProgress: (percent: number) => void,
  options?: { bucket?: string; isTestimony?: boolean }
): Promise<StorageUploadResult> {
  onProgress(8)
  const formData = new FormData()
  formData.append('file', file)
  if (options?.bucket) formData.append('bucket', options.bucket)
  if (options?.isTestimony) formData.append('isTestimony', 'true')

  const data = await new Promise<{ publicUrl?: string; key?: string; error?: string; usePresigned?: boolean }>(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/admin/storage/upload')
      xhr.timeout = 120_000
      xhr.withCredentials = true
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          onProgress(8 + Math.min(82, Math.round((e.loaded / e.total) * 82)))
        }
      }
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          if (xhr.status === 413 || json.usePresigned) {
            reject(new Error('PRESIGNED_REQUIRED'))
            return
          }
          if (xhr.status >= 200 && xhr.status < 300) resolve(json)
          else reject(new Error(json.error || `Upload failed (${xhr.status})`))
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`))
        }
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.ontimeout = () => reject(new Error('Upload timed out'))
      xhr.send(formData)
    }
  )

  if (!data.publicUrl || !data.key) {
    throw new Error('Upload succeeded but server returned an invalid response')
  }
  onProgress(100)
  return { publicUrl: data.publicUrl, key: data.key }
}

async function uploadViaPresignedWithProgress(
  file: File,
  onProgress: (percent: number) => void,
  options?: { bucket?: string; isTestimony?: boolean }
): Promise<StorageUploadResult> {
  onProgress(12)
  const presignRes = await fetch('/api/admin/storage/presign', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      bucket: options?.bucket ?? 'media',
      isTestimony: options?.isTestimony ?? false,
    }),
  })
  const presignData = await presignRes.json()
  if (!presignRes.ok) {
    throw new Error(presignData.error || 'Failed to get upload URL')
  }

  onProgress(18)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 180_000)
  try {
    const uploadRes = await fetch(presignData.uploadUrl, {
      method: 'PUT',
      body: file,
      signal: controller.signal,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    })
    if (!uploadRes.ok) {
      throw new Error(`Direct upload failed (HTTP ${uploadRes.status})`)
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Upload timed out — try again')
    }
    await xhrSend(
      presignData.uploadUrl,
      'PUT',
      file,
      { 'Content-Type': file.type || 'application/octet-stream' },
      (pct) => onProgress(18 + Math.round(pct * 0.8))
    )
  } finally {
    clearTimeout(timer)
  }

  onProgress(100)
  return { publicUrl: presignData.publicUrl, key: presignData.key }
}

async function withRetries<T>(
  fn: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  let last: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      if (attempt < maxAttempts && isRetryable(e)) {
        await sleep(800 * attempt)
        continue
      }
      break
    }
  }
  throw last instanceof Error ? last : new Error('Upload failed')
}

export interface UploadWithProgressOptions {
  bucket?: string
  isTestimony?: boolean
  /** Resize large images so they can use the server API (default true). */
  compress?: boolean
}

/**
 * Upload with progress. Prefers server API (no R2 CORS); compresses large photos first.
 */
export async function uploadFileWithProgress(
  file: File,
  onProgress: (percent: number) => void,
  options?: UploadWithProgressOptions
): Promise<StorageUploadResult> {
  onProgress(1)

  let prepared = file
  const inferredMime = file.type || mimeFromFilename(file.name)
  if (options?.compress !== false && inferredMime?.startsWith('image/')) {
    if (!file.type && inferredMime) {
      prepared = new File([file], file.name, { type: inferredMime })
    }
    onProgress(2)
    prepared = await prepareImageForUpload(prepared)
    onProgress(5)
  }

  if (prepared.size <= API_UPLOAD_MAX_BYTES) {
    try {
      return await withRetries(() =>
        uploadViaApiWithProgress(prepared, onProgress, options)
      )
    } catch (apiError) {
      const msg = apiError instanceof Error ? apiError.message : ''
      if (msg !== 'PRESIGNED_REQUIRED' && !isRetryable(apiError)) {
        throw apiError
      }
    }
  }

  return withRetries(() =>
    uploadViaPresignedWithProgress(prepared, onProgress, options)
  )
}
