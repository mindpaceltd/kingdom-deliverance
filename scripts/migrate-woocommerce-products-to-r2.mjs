import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const BATCH_SIZE = 20

function safeFileNameFromUrl(url, fallback = 'asset.bin') {
  try {
    const parsed = new URL(url)
    const base = path.basename(parsed.pathname || '').trim()
    if (!base) return fallback
    return base.replace(/[^\w.\-()]+/g, '_')
  } catch {
    return fallback
  }
}

function toR2PublicUrl(publicBase, key) {
  const trimmed = String(publicBase || '').replace(/\/+$/, '')
  return `${trimmed}/${key}`
}

async function fetchBuffer(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  return { buffer, contentType }
}

async function uploadToR2(r2, bucket, key, body, contentType) {
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKey = process.env.R2_ACCESS_KEY_ID
  const secret = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

  if (!url || !serviceRole) throw new Error('Missing Supabase env vars')
  if (!accountId || !accessKey || !secret || !bucket || !publicBase) {
    throw new Error('Missing R2 env vars')
  }

  const supabase = createClient(url, serviceRole)
  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secret },
  })

  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, file_url, image_url')
    .or('file_url.ilike.%wonderfulbooks.org%,image_url.ilike.%wonderfulbooks.org%')
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = products || []

  let updatedCount = 0
  let fileMigrated = 0
  let imageMigrated = 0
  let failed = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    for (const product of batch) {
      try {
        const patch = {}
        const slug = product.slug || product.id

        if (product.file_url && product.file_url.includes('wonderfulbooks.org')) {
          const fileName = safeFileNameFromUrl(product.file_url, `${slug}.bin`)
          const key = `products/downloads/${slug}/${fileName}`
          const { buffer, contentType } = await fetchBuffer(product.file_url)
          await uploadToR2(r2, bucket, key, buffer, contentType)
          patch.file_url = toR2PublicUrl(publicBase, key)
          fileMigrated += 1
        }

        if (product.image_url && product.image_url.includes('wonderfulbooks.org')) {
          const imageName = safeFileNameFromUrl(product.image_url, `${slug}.jpg`)
          const key = `products/images/${slug}/${imageName}`
          const { buffer, contentType } = await fetchBuffer(product.image_url)
          await uploadToR2(r2, bucket, key, buffer, contentType)
          patch.image_url = toR2PublicUrl(publicBase, key)
          imageMigrated += 1
        }

        if (Object.keys(patch).length > 0) {
          const { error: updateError } = await supabase
            .from('products')
            .update(patch)
            .eq('id', product.id)
          if (updateError) throw updateError
          updatedCount += 1
        }
      } catch (err) {
        failed += 1
        console.error(`Failed product ${product.slug}:`, err instanceof Error ? err.message : err)
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        scanned: rows.length,
        updatedProducts: updatedCount,
        fileMigrated,
        imageMigrated,
        failed,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
