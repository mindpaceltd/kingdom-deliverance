'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils'
import { indexOnPublish } from '@/lib/seo/google-indexing'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'
import {
  PRODUCTS_ADMIN_PAGE_SIZE,
  PRODUCTS_ADMIN_SELECT,
  type ProductsAdminPageResult,
  type ProductsAdminStats,
} from '@/lib/products/admin-query'
import { computeProductSeoScore } from '@/lib/products/product-seo-score'

type ProductRow = Record<string, unknown>

export async function getProductsAdminStats(): Promise<
  ProductsAdminStats | { error: string }
> {
  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) return auth

  const supabase = createClient()
  const [totalRes, publishedRes, draftsRes] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft'),
  ])

  if (totalRes.error) return { error: totalRes.error.message }

  return {
    total: totalRes.count ?? 0,
    published: publishedRes.count ?? 0,
    drafts: draftsRes.count ?? 0,
  }
}

export async function getProductsAdminPage(options?: {
  page?: number
  pageSize?: number
}): Promise<ProductsAdminPageResult | { error: string }> {
  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) return auth

  const page = Math.max(0, options?.page ?? 0)
  const pageSize = options?.pageSize ?? PRODUCTS_ADMIN_PAGE_SIZE
  const from = page * pageSize
  const to = from + pageSize - 1

  const supabase = createClient()
  const { data, error, count } = await supabase
    .from('products')
    .select(PRODUCTS_ADMIN_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[getProductsAdminPage]', error.message)
    return { error: error.message }
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    data: data ?? [],
    total,
    page,
    pageSize,
    totalPages,
  }
}

function duplicateDisplayName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.startsWith('Copy of ')) return trimmed
  return `Copy of ${trimmed}`
}

async function uniqueProductSlug(
  admin: ReturnType<typeof createAdminClient>,
  baseSlug: string
): Promise<string> {
  let candidate = `${baseSlug}-copy`
  let attempt = 1

  while (attempt <= 99) {
    const { data: existing } = await admin
      .from('products')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (!existing) return candidate
    attempt++
    candidate = `${baseSlug}-copy-${attempt}`
  }

  throw new Error('Could not generate a unique slug for the duplicate')
}

function buildDuplicateInsert(source: ProductRow, name: string, slug: string) {
  const row: Record<string, unknown> = {
    name,
    slug,
    status: 'draft',
    short_description: source.short_description ?? null,
    description: source.description ?? null,
    regular_price_usd: source.regular_price_usd ?? 0,
    sale_price_usd: source.sale_price_usd ?? 0,
    price_usd: source.price_usd ?? 0,
    type: source.type ?? 'digital',
    category_id: source.category_id ?? null,
    image_url: source.image_url ?? null,
    image_alt: source.image_alt ?? null,
    file_url: source.file_url ?? null,
    weight_kg: source.weight_kg ?? 0,
    is_active: source.is_active ?? true,
    is_featured: source.is_featured ?? false,
    meta_title: source.meta_title ?? null,
    meta_description: source.meta_description ?? null,
    stock_status: source.stock_status ?? 'instock',
    download_limit: source.download_limit ?? -1,
    download_expiry_days: source.download_expiry_days ?? -1,
  }

  for (const key of [
    'length',
    'width',
    'height',
    'book_author',
    'is_virtual',
    'manage_stock',
    'stock_quantity',
    'total_sales',
  ] as const) {
    if (source[key] !== undefined && source[key] !== null) {
      row[key] = key === 'total_sales' ? 0 : source[key]
    }
  }

  return row
}

export async function saveProduct(data: any) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { id, gallery, ...rest } = data

  if (!rest.slug) {
    rest.slug = generateSlug(rest.name)
  }

  rest.seo_score = computeProductSeoScore({
    meta_title: rest.meta_title,
    meta_description: rest.meta_description,
    image_alt: rest.image_alt,
    description: rest.description,
    short_description: rest.short_description,
  })

  let productId = id

  if (id) {
    const { error } = await supabase
      .from('products')
      .update(rest)
      .eq('id', id)
    
    if (error) return { error: error.message }
  } else {
    const { data: newProd, error } = await supabase
      .from('products')
      .insert(rest)
      .select()
      .single()
    
    if (error) return { error: error.message }
    productId = newProd.id
  }

  if (gallery && Array.isArray(gallery)) {
    await supabase.from('product_gallery').delete().eq('product_id', productId)
    
    if (gallery.length > 0) {
      const galleryInserts = gallery.map((url: string, index: number) => ({
        product_id: productId,
        image_url: url,
        display_order: index
      }))
      
      const { error: galleryError } = await supabase
        .from('product_gallery')
        .insert(galleryInserts)
        
      if (galleryError) console.error("Gallery sync error:", galleryError.message)
    }
  }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  revalidatePath(`/shop/${rest.slug}`)

  if (user) {
    await indexOnPublish('product', rest.slug, rest.status, {
      is_active: rest.is_active,
    })
  }

  return { success: true, id: productId }
}

export async function deleteProduct(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  return { success: true }
}

export async function deleteProducts(ids: string[]) {
  if (ids.length === 0) {
    return { success: true }
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('products')
    .delete()
    .in('id', ids)

  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  return { success: true }
}

export async function duplicateProduct(
  id: string
): Promise<{ success: true; id: string } | { error: string }> {
  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) return auth

  const admin = createAdminClient()

  const { data: original, error: fetchError } = await admin
    .from('products')
    .select('*, product_gallery(*)')
    .eq('id', id)
    .single()

  if (fetchError || !original) {
    return { error: fetchError?.message ?? 'Product not found' }
  }

  const gallery = (original.product_gallery ?? []) as Array<{
    image_url: string
    display_order?: number
    alt_text?: string | null
  }>

  const newName = duplicateDisplayName(String(original.name ?? 'Product'))
  const baseSlug = generateSlug(newName)
  let newSlug: string
  try {
    newSlug = await uniqueProductSlug(admin, baseSlug)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Slug generation failed' }
  }

  const { data: copy, error: insertError } = await admin
    .from('products')
    .insert(buildDuplicateInsert(original as ProductRow, newName, newSlug))
    .select('id')
    .single()

  if (insertError) {
    console.error('[duplicateProduct]', insertError.message)
    return { error: insertError.message }
  }

  if (gallery.length > 0) {
    const galleryInserts = gallery.map((g, index) => ({
      product_id: copy.id,
      image_url: g.image_url,
      display_order: g.display_order ?? index,
      alt_text: g.alt_text ?? null,
    }))
    const { error: galleryError } = await admin
      .from('product_gallery')
      .insert(galleryInserts)
    if (galleryError) {
      console.error('[duplicateProduct] gallery:', galleryError.message)
    }
  }

  const { data: variants } = await admin
    .from('product_variants')
    .select('*')
    .eq('product_id', id)

  if (variants && variants.length > 0) {
    const variantInserts = variants.map((v) => ({
      product_id: copy.id,
      sku: v.sku ? `${v.sku}-copy` : null,
      stock_quantity: v.stock_quantity ?? 0,
      price_modifier: v.price_modifier ?? 0,
      attribute_value_ids: v.attribute_value_ids ?? [],
    }))
    await admin.from('product_variants').insert(variantInserts)
  }

  revalidatePath('/admin/products')
  return { success: true, id: copy.id }
}

export async function duplicateProducts(
  ids: string[]
): Promise<
  | { success: true; count: number; ids: string[]; failed?: string[] }
  | { error: string; count?: number }
> {
  if (ids.length === 0) return { success: true, count: 0, ids: [] }

  const created: string[] = []
  const failed: string[] = []

  for (const id of ids) {
    const result = await duplicateProduct(id)
    if ('error' in result) {
      failed.push(result.error)
      continue
    }
    created.push(result.id)
  }

  revalidatePath('/admin/products')

  if (created.length === 0) {
    return { error: failed[0] ?? 'Duplication failed', count: 0 }
  }

  return {
    success: true,
    count: created.length,
    ids: created,
    ...(failed.length > 0 ? { failed } : {}),
  }
}
