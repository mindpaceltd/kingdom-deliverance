/** Keep under Vercel API body limit (~4 MB) with headroom. */
const TARGET_MAX_BYTES = 3.2 * 1024 * 1024
const MAX_EDGE_PX = 2400

export function mimeFromFilename(name: string): string | null {
  const lower = name.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/jpeg'
  return null
}

function isCompressibleImage(file: File): boolean {
  if (file.type.startsWith('image/')) return file.type !== 'image/gif'
  return mimeFromFilename(file.name) !== null
}

/**
 * Downscale and re-encode large phone photos so they upload via the server API
 * (no browser CORS to R2). Returns the original file when already small enough.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!isCompressibleImage(file)) return file
  if (file.size <= TARGET_MAX_BYTES) return file

  const mime = file.type.startsWith('image/')
    ? file.type
    : mimeFromFilename(file.name) || 'image/jpeg'

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  try {
    const maxEdge = Math.max(bitmap.width, bitmap.height)
    const scale = maxEdge > MAX_EDGE_PX ? MAX_EDGE_PX / maxEdge : 1
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
    let quality = 0.88
    let blob: Blob | null = null

    for (let attempt = 0; attempt < 6; attempt++) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality)
      })
      if (!blob) break
      if (blob.size <= TARGET_MAX_BYTES) {
        return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
      }
      quality -= 0.12
    }

    if (blob && blob.size < file.size) {
      return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
    }

    if (mime !== 'image/jpeg' && file.size > TARGET_MAX_BYTES) {
      const fallback = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.75)
      })
      if (fallback) {
        return new File([fallback], `${baseName}.jpg`, { type: 'image/jpeg' })
      }
    }

    return file
  } finally {
    bitmap.close()
  }
}
