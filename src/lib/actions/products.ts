'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils'

export async function saveProduct(data: any) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Generate slug if not provided
  if (!data.slug) {
    data.slug = generateSlug(data.name)
  }

  const { id, ...rest } = data

  if (id) {
    const { error } = await supabase
      .from('products')
      .update(rest)
      .eq('id', id)
    
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('products')
      .insert(rest)
    
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/products')
  revalidatePath('/shop') // Assuming shop page exists later
  return { success: true }
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
