import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedUploadUrl } from '@/lib/services/r2-storage'
import { buildUploadKey, resolveUploadBucket } from '@/lib/storage/r2-upload-params'

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

    const bucket = resolveUploadBucket(contentType, passedBucket, isTestimony)
    const key = buildUploadKey(filename, contentType, passedBucket, isTestimony)

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
