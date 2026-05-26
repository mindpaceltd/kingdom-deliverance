'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils'
import { indexOnPublish } from '@/lib/seo/google-indexing'

export async function saveProduct(data: any) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Extract gallery and other fields
  const { id, gallery, ...rest } = data

  // Generate slug if not provided
  if (!rest.slug) {
    rest.slug = generateSlug(rest.name)
  }

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

  // Sync Gallery
  if (gallery && Array.isArray(gallery)) {
    // 1. Delete old gallery images for this product
    await supabase.from('product_gallery').delete().eq('product_id', productId)
    
    // 2. Insert new gallery images
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

  const { data: { user } } = await supabase.auth.getUser()
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

export async function duplicateProduct(id: string) {
  const supabase = createClient()
  
  // 1. Fetch original
  const { data: original, error: fetchError } = await supabase
    .from('products')
    .select('*, product_gallery(*)')
    .eq('id', id)
    .single()
    
  if (fetchError) return { error: fetchError.message }
  
  // 2. Create copy
  const { id: _, created_at: __, updated_at: ___, product_gallery, ...rest } = original
  const newName = `${rest.name} (Copy)`
  let newSlug = generateSlug(newName)
  
  // Basic uniqueness check for products
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('slug', newSlug)
    .maybeSingle()
  
  if (existing) {
    newSlug = `${newSlug}-${Math.floor(Math.random() * 1000)}`
  }

  const copyData = {
    ...rest,
    name: newName,
    slug: newSlug,
    status: 'draft'
  }
  
  const { data: copy, error: insertError } = await supabase
    .from('products')
    .insert(copyData)
    .select()
    .single()
    
  if (insertError) return { error: insertError.message }
  
  // 3. Copy Gallery
  if (product_gallery && product_gallery.length > 0) {
    const galleryInserts = product_gallery.map((g: any) => ({
      product_id: copy.id,
      image_url: g.image_url,
      display_order: g.display_order,
      alt_text: g.alt_text
    }))
    await supabase.from('product_gallery').insert(galleryInserts)
  }
  
  revalidatePath('/admin/products')
  return { success: true, id: copy.id }
}

export async function duplicateProducts(
  ids: string[]
): Promise<
  | { success: true; count: number; ids: string[] }
  | { error: string; count?: number }
> {
  if (ids.length === 0) return { success: true, count: 0, ids: [] }

  const created: string[] = []
  for (const id of ids) {
    const result = await duplicateProduct(id)
    if ('error' in result) {
      return {
        error: result.error,
        count: created.length,
      }
    }
    if ('id' in result && result.id) created.push(result.id)
  }

  revalidatePath('/admin/products')
  return { success: true, count: created.length, ids: created }
}
