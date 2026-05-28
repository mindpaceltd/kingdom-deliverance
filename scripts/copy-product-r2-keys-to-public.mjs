import { createClient } from '@supabase/supabase-js'
import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3'

function keyFromPublicUrl(url) {
  const marker = '.r2.dev/'
  const idx = String(url || '').indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length).replace(/^\/+/, '')
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const privateBucket = process.env.R2_BUCKET_NAME || 'kdc-media'
  const publicBucket = process.env.R2_PUBLIC_BUCKET || 'kdc-media-public'

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })

  const { data: rows, error } = await supabase
    .from('products')
    .select('id, file_url, image_url')
    .or('file_url.ilike.%r2.dev%,image_url.ilike.%r2.dev%')
  if (error) throw error

  const keys = new Set()
  for (const row of rows || []) {
    const fk = keyFromPublicUrl(row.file_url)
    const ik = keyFromPublicUrl(row.image_url)
    if (fk) keys.add(fk)
    if (ik) keys.add(ik)
  }

  let copied = 0
  let failed = 0
  for (const key of keys) {
    try {
      await r2.send(
        new CopyObjectCommand({
          Bucket: publicBucket,
          CopySource: encodeURI(`/${privateBucket}/${key}`),
          Key: key,
        })
      )
      copied += 1
    } catch {
      failed += 1
    }
  }

  console.log(JSON.stringify({ keys: keys.size, copied, failed }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
