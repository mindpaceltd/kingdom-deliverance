import type { StorageUploadResult } from '@/lib/storage/client-upload'

const API_UPLOAD_MAX_BYTES = 4 * 1024 * 1024

function xhrSend(
  url: string,
  method: string,
  body: Blob | FormData,
  headers: Record<string, string>,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
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
        reject(new Error(`Upload failed (HTTP ${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))
    xhr.send(body)
  })
}

async function uploadViaApiWithProgress(
  file: File,
  onProgress: (percent: number) => void,
  options?: { bucket?: string; isTestimony?: boolean }
): Promise<StorageUploadResult> {
  onProgress(2)
  const formData = new FormData()
  formData.append('file', file)
  if (options?.bucket) formData.append('bucket', options.bucket)
  if (options?.isTestimony) formData.append('isTestimony', 'true')

  const data = await new Promise<{ publicUrl?: string; key?: string; error?: string }>(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/admin/storage/upload')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          onProgress(Math.min(92, Math.round((e.loaded / e.total) * 92)))
        }
      }
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          if (xhr.status >= 200 && xhr.status < 300) resolve(json)
          else reject(new Error(json.error || `Upload failed (${xhr.status})`))
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`))
        }
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
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
  onProgress(5)
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

  onProgress(10)
  await xhrSend(
    presignData.uploadUrl,
    'PUT',
    file,
    { 'Content-Type': file.type || 'application/octet-stream' },
    (pct) => onProgress(10 + Math.round(pct * 0.88))
  )

  onProgress(100)
  return { publicUrl: presignData.publicUrl, key: presignData.key }
}

/** Upload with byte-level progress for gallery bulk UI. */
export async function uploadFileWithProgress(
  file: File,
  onProgress: (percent: number) => void,
  options?: { bucket?: string; isTestimony?: boolean }
): Promise<StorageUploadResult> {
  if (file.size > API_UPLOAD_MAX_BYTES) {
    return uploadViaPresignedWithProgress(file, onProgress, options)
  }
  try {
    return await uploadViaApiWithProgress(file, onProgress, options)
  } catch {
    onProgress(5)
    return uploadViaPresignedWithProgress(file, onProgress, options)
  }
}
