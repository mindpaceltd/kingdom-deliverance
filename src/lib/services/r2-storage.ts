import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import * as https from 'https'

// S3 Client configuration for Cloudflare R2
const r2Client = new S3Client({
  region: 'us-east-1',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({
      keepAlive: false,
    }),
  }),
})

const defaultBucket = process.env.R2_BUCKET_NAME || 'kdc-media-storage'
const publicUrlBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''

/**
 * Uploads a file buffer directly to Cloudflare R2.
 * Good for server actions or smaller files.
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | Blob | string,
  contentType: string,
  bucket: string = defaultBucket
): Promise<{ url: string; key: string } | { error: string }> {
  try {
    const cleanKey = key.replace(/^\/+/, '') // Remove leading slashes if any

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: cleanKey,
        Body: body,
        ContentType: contentType,
      })
    )

    // Build the final public CDN destination URL
    const baseUrl = publicUrlBase.replace(/\/$/, '')
    const url = `${baseUrl}/${cleanKey}`

    return { url, key: cleanKey }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[r2-storage] Upload failed:', msg)
    return { error: `Upload failed: ${msg}` }
  }
}

/**
 * Deletes a file from Cloudflare R2.
 */
export async function deleteFile(
  key: string,
  bucket: string = defaultBucket
): Promise<{ success: true } | { error: string }> {
  try {
    const cleanKey = key.replace(/^\/+/, '')

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: cleanKey,
      })
    )

    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[r2-storage] Deletion failed:', msg)
    return { error: `Deletion failed: ${msg}` }
  }
}

/**
 * Generates a presigned upload URL (PUT) for direct client-side browser uploads.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600,
  bucket: string = defaultBucket
): Promise<{ uploadUrl: string; publicUrl: string; key: string } | { error: string }> {
  try {
    const cleanKey = key.replace(/^\/+/, '')

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds })
    const baseUrl = publicUrlBase.replace(/\/$/, '')
    const publicUrl = `${baseUrl}/${cleanKey}`

    return { uploadUrl, publicUrl, key: cleanKey }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[r2-storage] Presign generation failed:', msg)
    return { error: `Presign generation failed: ${msg}` }
  }
}

/**
 * Generates a presigned download URL (GET) for time-limited access to private files.
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 60,
  bucket: string = defaultBucket
): Promise<{ url: string } | { error: string }> {
  try {
    const cleanKey = key.replace(/^\/+/, '')

    // We need to import GetObjectCommand if not already imported
    // Wait, let's just use it, but ensure it's imported at the top of the file
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
    })

    const url = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds })
    return { url }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[r2-storage] Presign download generation failed:', msg)
    return { error: `Presign generation failed: ${msg}` }
  }
}

/**
 * Normalizes or extracts the R2 Key from an absolute R2 public URL.
 */
export function getKeyFromUrl(url: string): string | null {
  if (!url) return null
  const baseUrl = publicUrlBase.replace(/\/$/, '')
  if (url.startsWith(baseUrl)) {
    return url.slice(baseUrl.length).replace(/^\/+/, '')
  }
  
  // Also support extracting from the dev bucket domain if applicable
  const devMarker = '.r2.dev/'
  const markerIdx = url.indexOf(devMarker)
  if (markerIdx !== -1) {
    return url.slice(markerIdx + devMarker.length).replace(/^\/+/, '')
  }

  // Fallback: if it's already a relative path
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url.replace(/^\/+/, '')
  }

  return null
}

/**
 * Copies an object from the private bucket (defaultBucket) to the public bucket.
 * 
 * @param key - the object's key (path) inside the private bucket.
 * @param publicBucket - name of the public bucket.
 * @returns `{ ok: true }` on success or `{ error: string }` on failure.
 */
export async function copyObjectToPublicBucket(
  key: string,
  publicBucket: string = 'kdc-media-public'
): Promise<{ ok: true } | { error: string }> {
  try {
    const cleanKey = key.replace(/^\/+/, '')

    // Import CopyObjectCommand from the SDK
    const { CopyObjectCommand } = await import('@aws-sdk/client-s3')

    // CopyObjectCommand performs a direct cloud-to-cloud copy inside R2!
    // CopySource must be formatted as: "/source_bucket/source_key"
    const copyCommand = new CopyObjectCommand({
      Bucket: publicBucket,
      CopySource: encodeURI(`/${defaultBucket}/${cleanKey}`),
      Key: cleanKey,
    })

    await r2Client.send(copyCommand)

    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[r2-storage] copy to public bucket failed:', msg)
    return { error: `Copy failed: ${msg}` }
  }
}

/**
 * Returns the public URL for an object that lives in the public bucket.
 */
export function getPublicUrl(key: string): string {
  if (!key) return ''
  const cleanKey = key.replace(/^\/+/, '')
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') || 'https://pub-6299bd19a8614368b611590ccf05ac14.r2.dev'
  return `${base}/${cleanKey}`
}

