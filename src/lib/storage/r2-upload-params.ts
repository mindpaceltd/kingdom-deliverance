export function resolveUploadBucket(
  contentType: string,
  passedBucket?: string,
  isTestimony = false
): string {
  const isWebFacingMedia =
    contentType.startsWith('image/') ||
    contentType.startsWith('video/') ||
    isTestimony

  if (passedBucket && passedBucket !== 'media') {
    return passedBucket
  }

  return isWebFacingMedia
    ? process.env.R2_PUBLIC_BUCKET_NAME || 'kdc-media-public'
    : process.env.R2_BUCKET_NAME || 'kdc-media-storage'
}

export function buildUploadKey(
  filename: string,
  contentType: string,
  passedBucket?: string,
  isTestimony = false
): string {
  let prefix = 'uploads'
  if (contentType.startsWith('image/')) prefix = 'images'
  if (contentType.startsWith('video/')) prefix = 'videos'
  if (contentType.startsWith('audio/')) prefix = 'audio'
  if (passedBucket && passedBucket !== 'media') prefix = passedBucket
  if (isTestimony) prefix = 'testimonies'

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${prefix}/${Date.now()}-${safeName}`
}
