import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import { createClient } from '@supabase/supabase-js'

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

function getValue(row, ...keys) {
  if (!row) return ''
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

function parseBoolean(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return ['yes', 'true', '1', 'on'].includes(normalized)
}

function parseNumber(value, fallback = 0) {
  const numeric = Number(String(value || '').replace(/[^0-9.+-]/g, ''))
  return Number.isFinite(numeric) ? numeric : fallback
}

function parseUrls(value) {
  if (!value) return []
  return Array.from(String(value).matchAll(/https?:\/\/[^\s,!|;]+/gi))
    .map((m) => m[0].trim())
    .filter(Boolean)
}

function splitCategories(value) {
  const raw = String(value || '').trim()
  if (!raw) return []
  const separator = raw.includes('|') ? '|' : raw.includes(',') ? ',' : null
  return (separator ? raw.split(separator) : [raw]).map((x) => x.trim()).filter(Boolean)
}

function chunk(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

async function main() {
  const [,, inputCsv = 'product-import-ready.csv'] = process.argv
  const csvPath = path.resolve(process.cwd(), inputCsv)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(url, serviceRole)
  const csv = await fs.readFile(csvPath, 'utf8')
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
  if (parsed.errors.length) {
    throw new Error(`CSV parse errors: ${JSON.stringify(parsed.errors.slice(0, 3))}`)
  }

  const rows = parsed.data.filter((row) => getValue(row, 'Name'))
  const allCategoryNames = new Set()
  rows.forEach((row) => splitCategories(getValue(row, 'Category')).forEach((c) => allCategoryNames.add(c)))

  const { data: existingCategories } = await supabase.from('product_categories').select('id,name,slug')
  const categoryMap = new Map((existingCategories || []).map((c) => [c.name.toLowerCase(), c.id]))
  const missing = Array.from(allCategoryNames).filter((name) => !categoryMap.has(name.toLowerCase()))
  if (missing.length) {
    const usedCategorySlugs = new Set((existingCategories || []).map((c) => c.slug).filter(Boolean))
    const rows = missing.map((name) => {
      const base = slugify(name) || 'category'
      let slug = base
      let suffix = 1
      while (usedCategorySlugs.has(slug)) {
        slug = `${base}-${suffix++}`
      }
      usedCategorySlugs.add(slug)
      return { name, slug }
    })
    const { data: inserted, error: insertCatError } = await supabase
      .from('product_categories')
      .insert(rows)
      .select('id,name,slug')
    if (insertCatError) throw insertCatError
    ;(inserted || []).forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id))
  }

  const productsPayload = rows.map((row) => {
    const categories = splitCategories(getValue(row, 'Category'))
    const primaryCategory = categories[0] || ''
    return {
      name: getValue(row, 'Name'),
      slug: getValue(row, 'Slug'),
      regular_price_usd: parseNumber(getValue(row, 'Regular Price (USD)'), 0),
      sale_price_usd: parseNumber(getValue(row, 'Sale Price (USD)'), 0),
      type: getValue(row, 'Type') || 'digital',
      category_id: categoryMap.get(primaryCategory.toLowerCase()) || null,
      stock_status: getValue(row, 'Stock Status') || 'instock',
      image_url: getValue(row, 'Featured Image URL'),
      image_alt: getValue(row, 'Featured Image Alt Text'),
      short_description: getValue(row, 'Short Description'),
      description: getValue(row, 'Description'),
      file_url: getValue(row, 'File URL'),
      download_limit: parseInt(getValue(row, 'Download Limit') || '-1', 10) || -1,
      download_expiry_days: parseInt(getValue(row, 'Download Expiry Days') || '-1', 10) || -1,
      is_featured: parseBoolean(getValue(row, 'Is Featured')),
      status: getValue(row, 'Status') || 'published',
      is_active: true,
    }
  })

  const { error: upsertError } = await supabase
    .from('products')
    .upsert(productsPayload, { onConflict: 'slug' })
  if (upsertError) throw upsertError

  const slugs = productsPayload.map((p) => p.slug).filter(Boolean)
  const insertedProducts = []
  for (const slugChunk of chunk(slugs, 80)) {
    const { data, error: productFetchError } = await supabase
      .from('products')
      .select('id, slug, image_alt')
      .in('slug', slugChunk)
    if (productFetchError) throw productFetchError
    insertedProducts.push(...(data || []))
  }
  const idBySlug = new Map((insertedProducts || []).map((p) => [p.slug, p.id]))
  const altBySlug = new Map((insertedProducts || []).map((p) => [p.slug, p.image_alt || '']))

  const galleryRows = []
  rows.forEach((row) => {
    const slug = getValue(row, 'Slug')
    const productId = idBySlug.get(slug)
    if (!productId) return
    const urls = parseUrls(getValue(row, 'Gallery Image URLs'))
    urls.forEach((imageUrl, index) => {
      galleryRows.push({
        product_id: productId,
        image_url: imageUrl,
        alt_text: altBySlug.get(slug) || '',
        display_order: index,
      })
    })
  })

  if (galleryRows.length) {
    const productIds = Array.from(new Set(galleryRows.map((g) => g.product_id)))
    for (const idChunk of chunk(productIds, 200)) {
      await supabase.from('product_gallery').delete().in('product_id', idChunk)
    }
    const { error: galleryInsertError } = await supabase.from('product_gallery').insert(galleryRows)
    if (galleryInsertError) throw galleryInsertError
  }

  console.log(
    JSON.stringify(
      {
        importedProducts: productsPayload.length,
        createdCategories: missing.length,
        galleryRows: galleryRows.length,
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
