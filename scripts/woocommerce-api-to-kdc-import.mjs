import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toStatus(status) {
  const normalized = String(status || '').toLowerCase()
  return normalized === 'publish' ? 'published' : 'draft'
}

function normalizeType(product) {
  if (product.downloadable) return 'digital'
  return product.virtual ? 'digital' : 'physical'
}

function firstFileUrl(product) {
  const downloads = product.downloads || []
  if (!downloads.length) return ''
  return downloads[0]?.file || ''
}

function galleryUrls(product) {
  const images = product.images || []
  return images.map((img) => img?.src).filter(Boolean).join('|')
}

function featuredUrl(product) {
  const images = product.images || []
  return images[0]?.src || ''
}

function featuredAlt(product) {
  const images = product.images || []
  return images[0]?.alt || ''
}

function categories(product) {
  const list = product.categories || []
  return list.map((c) => c?.name).filter(Boolean).join(', ')
}

async function fetchWooProducts({ baseUrl, consumerKey, consumerSecret }) {
  const all = []
  let page = 1
  const perPage = 100

  while (true) {
    const endpoint = new URL('/wp-json/wc/v3/products', baseUrl)
    endpoint.searchParams.set('per_page', String(perPage))
    endpoint.searchParams.set('page', String(page))
    endpoint.searchParams.set('status', 'publish')
    endpoint.searchParams.set('consumer_key', consumerKey)
    endpoint.searchParams.set('consumer_secret', consumerSecret)

    const response = await fetch(endpoint)
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Woo API error ${response.status}: ${body}`)
    }

    const rows = await response.json()
    if (!Array.isArray(rows) || rows.length === 0) break
    all.push(...rows)

    if (rows.length < perPage) break
    page += 1
  }

  return all
}

async function main() {
  const [,, outputCsvArg = 'product-import-ready.csv'] = process.argv
  const baseUrl = process.env.WC_BASE_URL || 'https://wonderfulbooks.org'
  const consumerKey = process.env.WC_CONSUMER_KEY
  const consumerSecret = process.env.WC_CONSUMER_SECRET

  if (!consumerKey || !consumerSecret) {
    console.error('Missing WC_CONSUMER_KEY or WC_CONSUMER_SECRET environment variables.')
    process.exit(1)
  }

  const products = await fetchWooProducts({ baseUrl, consumerKey, consumerSecret })
  const output = products.map((product) => ({
    'Name': product.name || '',
    'Slug': product.slug || slugify(product.name),
    'Regular Price (USD)': product.regular_price || product.price || '0',
    'Sale Price (USD)': product.sale_price || '0',
    'Type': normalizeType(product),
    'Category': categories(product),
    'Stock Status': product.stock_status || 'instock',
    'Featured Image URL': featuredUrl(product),
    'Featured Image Alt Text': featuredAlt(product),
    'Short Description': stripHtml(product.short_description),
    'Description': product.description || '',
    'File URL': firstFileUrl(product),
    'Download Limit': String(product.download_limit ?? -1),
    'Download Expiry Days': String(product.download_expiry ?? -1),
    'Is Featured': product.featured ? 'yes' : 'no',
    'Status': toStatus(product.status),
    'Gallery Image URLs': galleryUrls(product),
  }))

  const csv = Papa.unparse(output, { quotes: true })
  const outPath = path.resolve(process.cwd(), outputCsvArg)
  await fs.writeFile(outPath, csv, 'utf-8')
  console.log(`Wrote ${output.length} products to ${outPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
