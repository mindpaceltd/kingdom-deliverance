'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils'

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
  const copyData = {
    ...rest,
    name: `${rest.name} (Copy)`,
    slug: `${rest.slug}-copy-${Math.floor(Math.random() * 1000)}`,
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
