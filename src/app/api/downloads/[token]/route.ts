import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createAdminClient()
  const { token } = params

  // 1. Look up the token
  const { data: downloadToken, error } = await supabase
    .from('download_tokens')
    .select('*, product:products(file_url, name)')
    .eq('token', token)
    .single()

  if (error || !downloadToken) {
    return NextResponse.json(
      { error: 'Invalid download link' },
      { status: 404 }
    )
  }

  // 2. Check expiry
  if (new Date(downloadToken.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'This download link has expired. Please contact support.' },
      { status: 410 }
    )
  }

  // 3. Check download count
  if (downloadToken.download_count >= downloadToken.max_downloads) {
    return NextResponse.json(
      { error: 'Download limit reached. Please contact support for assistance.' },
      { status: 403 }
    )
  }

  // 4. Get the file URL and generate a signed URL
  const fileUrl = downloadToken.product?.file_url
  if (!fileUrl) {
    return NextResponse.json(
      { error: 'File not available' },
      { status: 404 }
    )
  }

  // 5. Increment download count
  await supabase
    .from('download_tokens')
    .update({ download_count: downloadToken.download_count + 1 })
    .eq('id', downloadToken.id)

  // 6. Parse the storage path and generate signed URL
  // file_url could be: https://xxx.supabase.co/storage/v1/object/public/bucket/path
  // or just a relative path like: product-files/filename.pdf
  let signedUrl: string | null = null

  try {
    // Try to extract bucket and path from a full Supabase storage URL
    const storageMatch = fileUrl.match(
      /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/
    )

    if (storageMatch) {
      const bucket = storageMatch[1]
      const path = storageMatch[2]
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60) // 60 second expiry

      signedUrl = data?.signedUrl || null
    } else if (fileUrl.includes('.r2.dev') || fileUrl.includes('.r2.cloudflarestorage.com') || (process.env.NEXT_PUBLIC_R2_PUBLIC_URL && fileUrl.startsWith(process.env.NEXT_PUBLIC_R2_PUBLIC_URL))) {
      // It's an R2 URL. Let's extract the key and generate a presigned download URL.
      const { getKeyFromUrl, getPresignedDownloadUrl } = await import('@/lib/services/r2-storage')
      const key = getKeyFromUrl(fileUrl)
      
      if (key) {
        const result = await getPresignedDownloadUrl(key, 60) // 60 second expiry
        if (!('error' in result)) {
          signedUrl = result.url
        }
      }
    } else if (fileUrl.includes('/')) {
      // Assume format: bucket/path
      const parts = fileUrl.split('/')
      const bucket = parts[0]
      const path = parts.slice(1).join('/')
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60)

      signedUrl = data?.signedUrl || null
    }
  } catch (err) {
    console.error('Failed to generate signed URL:', err)
  }

  // Fallback: if we can't generate a signed URL, redirect to the file_url directly
  // (This handles cases where file is hosted externally)
  const redirectUrl = signedUrl || fileUrl

  return NextResponse.redirect(redirectUrl, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Disposition': `attachment; filename="${downloadToken.product?.name || 'download'}"`,
    },
  })
}
