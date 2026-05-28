import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const FILE_EXTENSIONS = new Set(['.pdf', '.epub', '.mobi', '.doc', '.docx'])

function normalizeText(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
}

function basenameWithoutExt(filePathOrUrl) {
  const raw = String(filePathOrUrl || '')
  if (!raw) return ''
  const clean = raw.split('?')[0].split('#')[0]
  const base = path.basename(clean)
  return base.replace(/\.[a-z0-9]+$/i, '')
}

function normalizeFileStem(stem) {
  return normalizeText(
    String(stem || '')
      .replace(/[-_](copy|\d+)$/i, '')
      .replace(/[-_][a-z0-9]{5,8}$/i, '')
  )
}

async function walkFiles(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(full)))
      continue
    }
    const ext = path.extname(entry.name).toLowerCase()
    if (FILE_EXTENSIONS.has(ext)) out.push(full)
  }
  return out
}

function scoreMatch(fileNorm, product) {
  const slugNorm = normalizeText(product.slug)
  const nameNorm = normalizeText(product.name)
  const sourceStemNorm = normalizeFileStem(basenameWithoutExt(product.file_url))
  let score = 0
  if (fileNorm.includes(slugNorm) || slugNorm.includes(fileNorm)) score += 5
  if (nameNorm && (fileNorm.includes(nameNorm) || nameNorm.includes(fileNorm))) score += 4
  if (sourceStemNorm) {
    if (fileNorm.includes(sourceStemNorm) || sourceStemNorm.includes(fileNorm)) score += 8
  }

  const slugTokens = String(product.slug || '').toLowerCase().split('-').filter(Boolean)
  const fileRaw = fileNorm
  const tokenHits = slugTokens.filter((t) => t.length > 3 && fileRaw.includes(normalizeText(t))).length
  score += Math.min(tokenHits, 5)
  return score
}

function keyForProduct(slug, filePath) {
  const baseName = path.basename(filePath).replace(/[^\w.\-()]+/g, '_')
  return `products/downloads/${slug}/${baseName}`
}

async function uploadToBucket(r2, bucket, key, buffer, contentType) {
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )
}

async function main() {
  const [,, sourceDirArg] = process.argv
  if (!sourceDirArg) {
    throw new Error('Usage: node scripts/match-local-ebooks-to-products-r2.mjs "<source_dir>"')
  }

  const sourceDir = path.resolve(sourceDirArg)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKey = process.env.R2_ACCESS_KEY_ID
  const secret = process.env.R2_SECRET_ACCESS_KEY
  const privateBucket = process.env.R2_BUCKET_NAME || 'kdc-media'
  const publicBucket = process.env.R2_PUBLIC_BUCKET || 'kdc-media-public'
  const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, '')
  if (!accountId || !accessKey || !secret || !publicBase) {
    throw new Error('Missing required R2 environment variables')
  }

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secret,
    },
  })

  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, name, file_url, regular_price_usd, sale_price_usd')
    .eq('type', 'digital')
    .order('name', { ascending: true })
  if (error) throw error

  const candidates = (products || []).filter((p) => {
    const current = String(p.file_url || '')
    return !current || current.includes('wonderfulbooks.org') || current.includes('prophetclimate.co.uk')
  })

  const files = await walkFiles(sourceDir)
  const availableByProductId = new Map()
  const unmatchedFiles = []
  const usedFiles = new Set()

  for (const filePath of files) {
    const fileNorm = normalizeText(path.basename(filePath))
    let best = null
    for (const product of candidates) {
      if (availableByProductId.has(product.id)) continue
      const score = scoreMatch(fileNorm, product)
      if (!best || score > best.score) best = { score, product }
    }
    if (!best || best.score < 4) {
      unmatchedFiles.push(filePath)
      continue
    }
    availableByProductId.set(best.product.id, filePath)
    usedFiles.add(filePath)
  }

  const updated = []
  const failed = []

  for (const product of candidates) {
    const filePath = availableByProductId.get(product.id)
    if (!filePath) continue
    try {
      const key = keyForProduct(product.slug, filePath)
      const buffer = await fs.readFile(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const contentType =
        ext === '.pdf'
          ? 'application/pdf'
          : ext === '.epub'
            ? 'application/epub+zip'
            : 'application/octet-stream'

      await uploadToBucket(r2, privateBucket, key, buffer, contentType)
      await uploadToBucket(r2, publicBucket, key, buffer, contentType)

      const publicUrl = `${publicBase}/${key}`
      const { error: updateError } = await supabase
        .from('products')
        .update({ file_url: publicUrl })
        .eq('id', product.id)
      if (updateError) throw updateError

      updated.push({
        slug: product.slug,
        name: product.name,
        filePath,
        fileUrl: publicUrl,
        regular_price_usd: product.regular_price_usd,
        sale_price_usd: product.sale_price_usd,
      })
    } catch (e) {
      failed.push({
        slug: product.slug,
        name: product.name,
        filePath,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const unmatchedProducts = candidates
    .filter((p) => !availableByProductId.has(p.id))
    .map((p) => ({ slug: p.slug, name: p.name, file_url: p.file_url || '' }))

  const reportDir = path.resolve(process.cwd(), 'import-reports')
  await fs.mkdir(reportDir, { recursive: true })
  await fs.writeFile(
    path.join(reportDir, 'ebook-match-report.json'),
    JSON.stringify(
      {
        sourceDir,
        scannedFiles: files.length,
        matchedProducts: updated.length,
        failedUploads: failed.length,
        unmatchedProducts: unmatchedProducts.length,
        unmatchedFiles: unmatchedFiles.length,
        updated,
        failed,
        unmatchedProducts,
        unmatchedFiles,
      },
      null,
      2
    ),
    'utf8'
  )

  console.log(
    JSON.stringify(
      {
        scannedFiles: files.length,
        matchedProducts: updated.length,
        failedUploads: failed.length,
        unmatchedProducts: unmatchedProducts.length,
        report: 'import-reports/ebook-match-report.json',
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
