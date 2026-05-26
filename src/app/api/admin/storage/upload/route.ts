import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/services/r2-storage'
import { buildUploadKey, resolveUploadBucket } from '@/lib/storage/r2-upload-params'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const passedBucket = formData.get('bucket')?.toString()
    const isTestimony = formData.get('isTestimony') === 'true'

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isTestimony) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_BYTES / (1024 * 1024)}MB.` },
        { status: 413 }
      )
    }

    const contentType = file.type || 'application/octet-stream'
    const bucket = resolveUploadBucket(contentType, passedBucket, isTestimony)
    const key = buildUploadKey(file.name, contentType, passedBucket, isTestimony)
    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await uploadFile(key, buffer, contentType, bucket)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      publicUrl: result.url,
      key: result.key,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    console.error('[storage upload API]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
