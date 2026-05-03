import fs from 'fs/promises'
import path from 'path'
import Papa from 'papaparse'

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

function getValue(row, ...keys) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

function parseImageUrls(imagesField) {
  if (!imagesField) return []
  const urls = Array.from(imagesField.matchAll(/https?:\/\/[^\s,!|]+/gi)).map((m) => m[0].trim())
  return urls.filter(Boolean)
}

function parseImageAlt(imagesField) {
  if (!imagesField) return ''
  const match = imagesField.match(/alt\s*:\s*([^!\n]+)/i)
  return match ? match[1].trim() : ''
}

function parseDownloadableUrl(downloadableFiles) {
  if (!downloadableFiles) return ''
  const parts = downloadableFiles.split(/::/)
  if (parts.length > 1) {
    return parts[1].trim()
  }
  return downloadableFiles.trim()
}

function normalizeBoolean(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return ['yes', 'true', '1', 'on'].includes(normalized) ? 'yes' : 'no'
}

function toStatus(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'published' || normalized === 'publish' ? 'published' : 'draft'
}

async function main() {
  const [,, inputCsvPath, outputCsvPath = 'product-import-ready.csv'] = process.argv
  if (!inputCsvPath) {
    console.error('Usage: node scripts/woocommerce-to-kdc-import.mjs <input.csv> [output.csv]')
    process.exit(1)
  }

  const sourcePath = path.resolve(process.cwd(), inputCsvPath)
  const targetPath = path.resolve(process.cwd(), outputCsvPath)

  const content = await fs.readFile(sourcePath, 'utf-8')
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true })
  if (parsed.errors.length > 0) {
    console.error('CSV parse errors:')
    parsed.errors.forEach((err) => console.error(err))
    process.exit(1)
  }

  const rows = parsed.data.map((row) => {
    const title = getValue(row, 'post_title', 'Name', 'name')
    const postName = getValue(row, 'post_name')
    const imagesField = getValue(row, 'images')
    const imageUrls = parseImageUrls(imagesField)
    const featuredImage = getValue(row, 'Featured Image URL', 'image_url') || imageUrls[0] || ''
    const altText = getValue(row, 'Featured Image Alt Text', 'image_alt') || parseImageAlt(imagesField)
    const downloadableFiles = getValue(row, 'downloadable_files', 'File URL', 'file_url')
    const fileUrl = parseDownloadableUrl(downloadableFiles)
    const downloadable = getValue(row, 'downloadable', 'Downloadable')
    const productType = downloadable && downloadable.toLowerCase() === 'yes' ? 'digital' : getValue(row, 'Type', 'type') || 'physical'

    return {
      'Name': title,
      'Slug': postName || slugify(title),
      'Regular Price (USD)': getValue(row, 'regular_price', 'Regular Price (USD)', 'regular_price_usd') || '0',
      'Sale Price (USD)': getValue(row, 'sale_price', 'Sale Price (USD)', 'sale_price_usd') || '0',
      'Type': productType,
      'Category': getValue(row, 'tax:product_cat', 'product_cat', 'Category'),
      'Stock Status': getValue(row, 'stock_status', 'Stock Status') || 'instock',
      'Featured Image URL': featuredImage,
      'Featured Image Alt Text': altText,
      'Short Description': getValue(row, 'post_excerpt', 'Short Description') || '',
      'Description': getValue(row, 'post_content', 'Description') || '',
      'File URL': fileUrl,
      'Download Limit': getValue(row, 'download_limit', 'Download Limit') || '-1',
      'Download Expiry Days': getValue(row, 'download_expiry', 'Download Expiry Days') || '-1',
      'Is Featured': normalizeBoolean(getValue(row, 'tax:product_visibility', 'Is Featured', 'is_featured')),
      'Status': toStatus(getValue(row, 'post_status', 'Status')),
      'Gallery Image URLs': imageUrls.join('|')
    }
  })

  const csv = Papa.unparse(rows, { quotes: true })
  await fs.writeFile(targetPath, csv, 'utf-8')
  console.log(`Wrote ${rows.length} products to ${targetPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
