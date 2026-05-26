export interface StorageUploadResult {
  publicUrl: string
  key: string
}

/** Upload via Next.js API (server → R2). Avoids browser CORS on presigned PUT URLs. */
export async function uploadFileViaApi(
  file: File,
  options?: { bucket?: string; isTestimony?: boolean }
): Promise<StorageUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.bucket) formData.append('bucket', options.bucket)
  if (options?.isTestimony) formData.append('isTestimony', 'true')

  const res = await fetch('/api/admin/storage/upload', {
    method: 'POST',
    body: formData,
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`)
  }

  return { publicUrl: data.publicUrl, key: data.key }
}
