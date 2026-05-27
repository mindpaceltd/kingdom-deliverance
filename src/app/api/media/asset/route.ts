import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'

const r2Client = new S3Client({
  region: 'us-east-1',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
})

const PRIVATE_BUCKET = process.env.R2_BUCKET_NAME || 'kdc-media-storage'
const PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET_NAME || 'kdc-media-public'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!key || key.includes('..')) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  const cleanKey = key.replace(/^\/+/, '')

  for (const bucket of [PUBLIC_BUCKET, PRIVATE_BUCKET]) {
    try {
      const result = await r2Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: cleanKey })
      )

      if (!result.Body) continue

      const bytes = await result.Body.transformToByteArray()
      const contentType = result.ContentType || 'application/octet-stream'
      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      }
      if (contentType === 'application/pdf') {
        headers['Content-Disposition'] = 'inline'
      }

      return new NextResponse(bytes, { headers })
    } catch {
      // Try next bucket
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
