import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedUploadUrl } from '@/lib/services/r2-storage'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { filename, contentType, bucket: passedBucket, isTestimony = false } = body

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user && !isTestimony) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 })
    }

    const isWebFacingMedia =
      contentType.startsWith('image/') ||
      contentType.startsWith('video/') ||
      isTestimony

    // Public site assets must land in the public R2 bucket so r2.dev URLs work
    const bucket = (passedBucket && passedBucket !== 'media')
      ? passedBucket
      : isWebFacingMedia
        ? (process.env.R2_PUBLIC_BUCKET_NAME || 'kdc-media-public')
        : (process.env.R2_BUCKET_NAME || 'kdc-media-storage')

    // Determine path based on type
    let prefix = 'uploads'
    if (contentType.startsWith('image/')) prefix = 'images'
    if (contentType.startsWith('video/')) prefix = 'videos'
    if (contentType.startsWith('audio/')) prefix = 'audio'
    if (passedBucket && passedBucket !== 'media') prefix = passedBucket // e.g. organization-images
    
    // Force prefix for public testimony uploads
    if (isTestimony) {
      prefix = 'testimonies'
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `${prefix}/${Date.now()}-${safeName}`

    // Get Presigned URL valid for 1 hour (3600 seconds)
    const result = await getPresignedUploadUrl(key, contentType, 3600, bucket)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      publicUrl: result.publicUrl,
      key: result.key
    })

  } catch (error: any) {
    console.error('[presign API] Error:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
