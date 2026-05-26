export interface StorageUploadResult {
  publicUrl: string
  key: string
}

/** Vercel serverless request body limit (~4.5 MB). Larger files use presigned PUT. */
const API_UPLOAD_MAX_BYTES = 4 * 1024 * 1024

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('aborted') ||
    msg.includes('timeout')
  )
}

async function uploadViaPresigned(
  file: File,
  options?: { bucket?: string; isTestimony?: boolean }
): Promise<StorageUploadResult> {
  const presignRes = await fetch('/api/admin/storage/presign', {
    method: 'POST',
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

  const uploadRes = await fetch(presignData.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  })

  if (!uploadRes.ok) {
    throw new Error(`Direct storage upload failed (HTTP ${uploadRes.status})`)
  }

  return { publicUrl: presignData.publicUrl, key: presignData.key }
}

async function uploadViaApiOnce(
  file: File,
  options?: { bucket?: string; isTestimony?: boolean }
): Promise<StorageUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.bucket) formData.append('bucket', options.bucket)
  if (options?.isTestimony) formData.append('isTestimony', 'true')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)

  try {
    const res = await fetch('/api/admin/storage/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      credentials: 'same-origin',
    })

    let data: { error?: string; publicUrl?: string; key?: string } = {}
    try {
      data = await res.json()
    } catch {
      if (!res.ok) throw new Error(`Upload failed (${res.status})`)
    }

    if (!res.ok) {
      throw new Error(data.error || `Upload failed (${res.status})`)
    }

    if (!data.publicUrl || !data.key) {
      throw new Error('Upload succeeded but server returned an invalid response')
    }

    return { publicUrl: data.publicUrl, key: data.key }
  } finally {
    clearTimeout(timeout)
  }
}

async function uploadViaApiWithRetry(
  file: File,
  options?: { bucket?: string; isTestimony?: boolean }
): Promise<StorageUploadResult> {
  const maxAttempts = 3
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await uploadViaApiOnce(file, options)
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts && isRetryableNetworkError(error)) {
        await sleep(1000 * attempt)
        continue
      }
      break
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Upload failed')
}

/**
 * Upload to R2: small files via API (no CORS), large files via presigned PUT.
 * Falls back to presigned if API upload fails after retries.
 */
export async function uploadFileViaApi(
  file: File,
  options?: { bucket?: string; isTestimony?: boolean }
): Promise<StorageUploadResult> {
  if (file.size > API_UPLOAD_MAX_BYTES) {
    return uploadViaPresigned(file, options)
  }

  try {
    return await uploadViaApiWithRetry(file, options)
  } catch (apiError) {
    try {
      return await uploadViaPresigned(file, options)
    } catch (presignError) {
      const apiMsg = apiError instanceof Error ? apiError.message : 'API upload failed'
      const presignMsg =
        presignError instanceof Error ? presignError.message : 'Direct upload failed'
      throw new Error(`${apiMsg}. Fallback also failed: ${presignMsg}`)
    }
  }
}
