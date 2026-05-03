'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils'

function getValue(row: any, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

function parseBoolean(value: any) {
  const normalized = String(value || '').trim().toLowerCase()
  return ['yes', 'true', '1', 'on'].includes(normalized)
}

function parseUrls(value: string) {
  if (!value) return []
  const urls = Array.from(value.matchAll(/https?:\/\/[^\s,!|]+/gi)).map(m => m[0].trim())
  return urls.filter(Boolean)
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
  const categoryMap = new Map(categories?.map(c => [c.name.toLowerCase(), c.id]))

  const categoryNames = new Set<string>()

  const productsToInsert = csvData.map((row) => {
    const name = getValue(row, 'Name', 'name')
    const catName = getValue(row, 'Category', 'category', 'tax:product_cat')
    if (catName) categoryNames.add(catName.toLowerCase())
    const isDigital = parseBoolean(getValue(row, 'Downloadable', 'downloadable')) || !!getValue(row, 'File URL', 'file_url')
    const slug = getValue(row, 'Slug', 'slug') || generateSlug(name)

    return {
      name,
      slug,
      regular_price_usd: parseFloat(getValue(row, 'Regular Price (USD)', 'regular_price_usd', 'regular_price')) || 0,
      sale_price_usd: parseFloat(getValue(row, 'Sale Price (USD)', 'sale_price_usd', 'sale_price')) || 0,
      type: getValue(row, 'Type', 'type') || (isDigital ? 'digital' : 'physical'),
      category_name: catName,
      category_id: categoryMap.get(catName.toLowerCase()) || null,
      image_url: getValue(row, 'Featured Image URL', 'image_url', 'images'),
      image_alt: getValue(row, 'Featured Image Alt Text', 'image_alt'),
      short_description: getValue(row, 'Short Description', 'short_description', 'post_excerpt'),
      description: getValue(row, 'Description', 'description', 'post_content'),
      file_url: getValue(row, 'File URL', 'file_url', 'downloadable_files'),
      download_limit: parseInt(getValue(row, 'Download Limit', 'download_limit', 'download_limit'), 10) || -1,
      download_expiry_days: parseInt(getValue(row, 'Download Expiry Days', 'download_expiry_days', 'download_expiry_days'), 10) || -1,
      stock_status: getValue(row, 'Stock Status', 'stock_status') || 'instock',
      is_featured: parseBoolean(getValue(row, 'Is Featured', 'is_featured')),
      status: getValue(row, 'Status', 'status', 'post_status') || 'draft',
      is_active: true,
      gallery: parseUrls(getValue(row, 'Gallery Image URLs', 'gallery_image_urls')).join('|')
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

  const productsToUpsert = productsToInsert.map(({ category_name, gallery, ...product }) => ({
    ...product,
    category_id: product.category_id || (category_name ? categoryMap.get(category_name.toLowerCase()) : null)
  }))

  const { error } = await supabase.from('products').upsert(productsToUpsert, { onConflict: 'slug' }).select('id,slug')
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
    await supabase.from('product_gallery').insert(galleryRows)
  }

  revalidatePath('/admin/products')
  return { success: true, count: productsToInsert.length }
}
