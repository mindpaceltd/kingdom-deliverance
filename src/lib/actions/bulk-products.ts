'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils'

export async function exportProductsToCSV() {
  const supabase = createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('*, category:product_categories(name)')
    
  if (error) return { error: error.message }
  
  const headers = [
    'Name', 'Slug', 'Regular Price (USD)', 'Sale Price (USD)', 'Type', 
    'Category', 'Stock Status', 'Featured Image URL', 'Short Description', 'Status'
  ].join(',')
  
  const rows = products.map(p => [
    `"${p.name.replace(/"/g, '""')}"`,
    p.slug,
    p.regular_price_usd,
    p.sale_price_usd,
    p.type,
    `"${p.category?.name?.replace(/"/g, '""') || ''}"`,
    p.stock_status,
    `"${p.image_url || ''}"`,
    `"${(p.short_description || '').replace(/"/g, '""')}"`,
    p.status
  ].join(','))
  
  return { csv: [headers, ...rows].join('\n') }
}

export async function importProductsFromCSV(csvData: any[]) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  
  const { data: categories } = await supabase.from('product_categories').select('id, name')
  const categoryMap = new Map(categories?.map(c => [c.name.toLowerCase(), c.id]))

  const productsToInsert = csvData.map(row => {
    const name = row['Name'] || row['name']
    const catName = row['Category'] || row['category']
    const catId = categoryMap.get(catName?.toLowerCase()) || null

    return {
      name,
      slug: row['Slug'] || row['slug'] || generateSlug(name),
      regular_price_usd: parseFloat(row['Regular Price (USD)'] || row['regular_price_usd'] || '0'),
      sale_price_usd: parseFloat(row['Sale Price (USD)'] || row['sale_price_usd'] || '0'),
      type: row['Type'] || row['type'] || 'physical',
      category_id: catId,
      image_url: row['Featured Image URL'] || row['image_url'] || '',
      short_description: row['Short Description'] || row['short_description'] || '',
      status: row['Status'] || row['status'] || 'draft',
      is_active: true
    }
  }).filter(p => p.name)

  const { error } = await supabase.from('products').upsert(productsToInsert, { onConflict: 'slug' })
  
  if (error) return { error: error.message }
  
  revalidatePath('/admin/products')
  return { success: true, count: productsToInsert.length }
}
