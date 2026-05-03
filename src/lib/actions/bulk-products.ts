'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils'

function getValue(row: any, ...keys: string[]) {
  if (!row) return ''
  const normalizedRow: Record<string, any> = {}
  Object.keys(row).forEach((key) => {
    normalizedRow[String(key || '').trim().toLowerCase()] = row[key]
  })

  for (const key of keys) {
    const normalizedKey = String(key || '').trim().toLowerCase()
    const value = normalizedRow[normalizedKey]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

function parseCategoryName(value: string) {
  if (!value) return ''
  const text = String(value).trim()
  const separator = text.includes('|') ? '|' : text.includes(',') ? ',' : text.includes('>') ? '>' : null
  return separator ? text.split(separator)[0].trim() : text
}

function parseBoolean(value: any) {
  const normalized = String(value || '').trim().toLowerCase()
  return ['yes', 'true', '1', 'on'].includes(normalized)
}

function parseNumber(value: any) {
  const normalized = String(value || '').trim()
  if (!normalized) return null
  const numeric = Number(normalized.replace(/[^0-9.+-]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

function parseUrls(value: string) {
  if (!value) return []
  const urls = Array.from(value.matchAll(/https?:\/\/[^\s,!|;]+/gi)).map((m) => m[0].trim())
  return urls.filter(Boolean)
}

function getUniqueSlug(base: string, existingSlugSet: Set<string>, usedSlugs: Set<string>) {
  let slug = base || 'product'
  let suffix = 1
  while (existingSlugSet.has(slug) || usedSlugs.has(slug)) {
    slug = `${base || 'product'}-${suffix++}`
  }
  usedSlugs.add(slug)
  return slug
}

export async function exportProductsToCSV() {
  const supabase = createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('*, category:product_categories(name)')

  if (error) return { error: error.message }

  const headers = [
    'Name',
    'Slug',
    'Regular Price (USD)',
    'Sale Price (USD)',
    'Type',
    'Category',
    'Stock Status',
    'Featured Image URL',
    'Featured Image Alt Text',
    'Short Description',
    'Description',
    'File URL',
    'Download Limit',
    'Download Expiry Days',
    'Is Featured',
    'Status'
  ].join(',')

  const rows = (products || []).map((p) => [
    `"${String(p.name || '').replace(/"/g, '""')}"`,
    p.slug || '',
    p.regular_price_usd ?? 0,
    p.sale_price_usd ?? 0,
    p.type || 'physical',
    `"${String(p.category?.name || '').replace(/"/g, '""')}"`,
    p.stock_status || 'instock',
    `"${String(p.image_url || '').replace(/"/g, '""')}"`,
    `"${String(p.image_alt || '').replace(/"/g, '""')}"`,
    `"${String(p.short_description || '').replace(/"/g, '""')}"`,
    `"${String(p.description || '').replace(/"/g, '""')}"`,
    `"${String(p.file_url || '').replace(/"/g, '""')}"`,
    p.download_limit ?? -1,
    p.download_expiry_days ?? -1,
    p.is_featured ? 'yes' : 'no',
    p.status || 'draft'
  ].join(','))

  return { csv: [headers, ...rows].join('\n') }
}

export async function importProductsFromCSV(csvData: any[]) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: categories } = await supabase.from('product_categories').select('id, name')
  const categoryMap = new Map(categories?.map((c) => [c.name.toLowerCase(), c.id]))

  const { data: existingProducts } = await supabase.from('products').select('slug')
  const existingSlugSet = new Set(
    (existingProducts || [])
      .map((product: any) => product.slug)
      .filter(Boolean)
  )
  const usedSlugs = new Set<string>()

  const categoryNames = new Set<string>()

  const productsToInsert = csvData.map((row) => {
    const name = getValue(row, 'Name', 'name', 'post_title', 'title')
    const rawSlug = getValue(row, 'Slug', 'slug', 'post_name')
    const catNameRaw = getValue(row, 'Category', 'category', 'tax:product_cat', 'Categories', 'categories')
    const catName = parseCategoryName(catNameRaw)
    if (catName) categoryNames.add(catName.toLowerCase())
    const downloadable = getValue(row, 'Downloadable', 'downloadable', 'is_downloadable')
    const isDigital = parseBoolean(downloadable) || !!getValue(row, 'File URL', 'file_url', 'downloadable_files')
    const isVirtual = parseBoolean(getValue(row, 'Virtual', 'virtual', 'is_virtual'))
    const managedStock = parseBoolean(getValue(row, 'Manage Stock', 'manage_stock'))
    const stockQuantity = parseInt(getValue(row, 'Stock', 'stock', 'stock_quantity'), 10)
    const weight = parseNumber(getValue(row, 'Weight', 'weight_kg'))
    const length = parseNumber(getValue(row, 'Length', 'length'))
    const width = parseNumber(getValue(row, 'Width', 'width'))
    const height = parseNumber(getValue(row, 'Height', 'height'))

    const slugBase = generateSlug(rawSlug || name)
    const slug = getUniqueSlug(slugBase, existingSlugSet, usedSlugs)

    const featuredImageFromImages = getValue(row, 'Images', 'images', 'image_url', 'Featured Image URL', 'image', 'featured_image')
    const allImageUrls = parseUrls(featuredImageFromImages)
    const featuredImage = getValue(row, 'Featured Image URL', 'image_url', 'Featured Image', 'featured_image') || allImageUrls[0] || ''
    const gallerySource = getValue(row, 'Gallery Image URLs', 'gallery_image_urls', 'Images', 'images', 'Gallery', 'gallery')
    const galleryUrls = parseUrls(gallerySource)
    const galleryFinal = galleryUrls.length > 0 ? galleryUrls : allImageUrls.slice(featuredImage ? 1 : 0)

    const explicitStockStatus = getValue(row, 'Stock Status', 'stock_status', 'In stock?')
    const computedStockStatus = String(explicitStockStatus || '').trim().toLowerCase() || (managedStock || !Number.isNaN(stockQuantity)
      ? stockQuantity > 0
        ? 'instock'
        : 'outofstock'
      : '')

    return {
      name,
      slug,
      regular_price_usd: parseFloat(getValue(row, 'Regular Price (USD)', 'regular_price_usd', 'regular_price')) || 0,
      sale_price_usd: parseFloat(getValue(row, 'Sale Price (USD)', 'sale_price_usd', 'sale_price')) || 0,
      type: getValue(row, 'Type', 'type', 'tax:product_type') || (isDigital || isVirtual ? 'digital' : 'physical'),
      category_name: catName,
      category_id: categoryMap.get(catName.toLowerCase()) || null,
      image_url: featuredImage,
      image_alt: getValue(row, 'Featured Image Alt Text', 'image_alt', 'alt_text', 'Image Alt Text'),
      short_description: getValue(row, 'Short Description', 'short_description', 'post_excerpt', 'Excerpt'),
      description: getValue(row, 'Description', 'description', 'post_content', 'Content'),
      file_url: getValue(row, 'File URL', 'file_url', 'downloadable_files', 'Downloadable Files'),
      download_limit: parseInt(getValue(row, 'Download Limit', 'download_limit'), 10) || -1,
      download_expiry_days: parseInt(getValue(row, 'Download Expiry Days', 'download_expiry_days', 'download_expiry'), 10) || -1,
      stock_status: computedStockStatus || 'instock',
      is_featured: parseBoolean(getValue(row, 'Is Featured', 'is_featured', 'Featured', 'featured', 'tax:product_visibility')),
      status: getValue(row, 'Status', 'status', 'post_status') || 'draft',
      weight_kg: weight ?? 0,
      length: length ?? null,
      width: width ?? null,
      height: height ?? null,
      variant_sku: getValue(row, 'SKU', 'sku'),
      variant_stock_quantity: Number.isFinite(stockQuantity) ? stockQuantity : null,
      variant_manage_stock: managedStock,
      variant_virtual: isVirtual,
      is_active: true,
      gallery: galleryFinal.join('|')
    }
  }).filter((p) => p.name)

  const missingCategoryNames = Array.from(categoryNames).filter((name) => !categoryMap.has(name))
  if (missingCategoryNames.length > 0) {
    const insertPayload = missingCategoryNames.map((name) => ({ name }))
    const { data: insertedCategories } = await supabase
      .from('product_categories')
      .insert(insertPayload)
      .select('id, name')

    insertedCategories?.forEach((cat) => {
      categoryMap.set(cat.name.toLowerCase(), cat.id)
    })
  }

  const productsToUpsert = productsToInsert.map(({
    category_name,
    gallery,
    variant_sku,
    variant_stock_quantity,
    variant_manage_stock,
    variant_virtual,
    length,
    width,
    height,
    ...product
  }) => ({
    ...product,
    category_id: product.category_id || (category_name ? categoryMap.get(category_name.toLowerCase()) : null)
  }))

  const { data: upsertedProducts, error } = await supabase.from('products').upsert(productsToUpsert, { onConflict: 'slug' }).select('id,slug')
  if (error) return { error: error.message }

  const galleryRows: any[] = []
  const insertedProducts = (await supabase.from('products').select('id,slug').in('slug', productsToInsert.map((p) => p.slug))).data || []
  const productIdBySlug = new Map(insertedProducts.map((p) => [p.slug, p.id]))

  productsToInsert.forEach((product) => {
    const galleryUrls = (product.gallery || '').split('|').map((url: string) => url.trim()).filter(Boolean)
    const productId = productIdBySlug.get(product.slug)
    if (productId && galleryUrls.length > 0) {
      galleryUrls.forEach((url: string, index: number) => {
        galleryRows.push({
          product_id: productId,
          image_url: url,
          alt_text: product.image_alt || '',
          display_order: index
        })
      })
    }
  })

  if (galleryRows.length > 0) {
    const productIds = Array.from(new Set(galleryRows.map((row) => row.product_id)))
    await supabase.from('product_gallery').delete().in('product_id', productIds)
    await supabase.from('product_gallery').insert(galleryRows)
  }

  const variantRows: any[] = []
  productsToInsert.forEach((product) => {
    const productId = productIdBySlug.get(product.slug)
    if (!productId) return

    const sku = product.variant_sku
    const stockQuantity = Number.isFinite(product.variant_stock_quantity) ? product.variant_stock_quantity : null
    if (sku || stockQuantity !== null) {
      variantRows.push({
        product_id: productId,
        sku: sku || '',
        stock_quantity: stockQuantity ?? 0,
        price_modifier: 0,
        attribute_value_ids: []
      })
    }
  })

  if (variantRows.length > 0) {
    const variantProductIds = Array.from(new Set(variantRows.map((variant) => variant.product_id)))
    await supabase.from('product_variants').delete().in('product_id', variantProductIds)
    await supabase.from('product_variants').insert(variantRows)
  }

  revalidatePath('/admin/products')
  return {
    success: true,
    count: upsertedProducts?.length ?? 0,
    skipped: csvData.length - productsToInsert.length
  }
}
