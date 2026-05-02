'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils'

export async function saveCategory(data: any) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!data.slug) {
    data.slug = generateSlug(data.name)
  }

  const { id, ...rest } = data

  if (id) {
    const { error } = await supabase
      .from('product_categories')
      .update(rest)
      .eq('id', id)
    
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('product_categories')
      .insert(rest)
    
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/products/categories')
  revalidatePath('/shop')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/products/categories')
  return { success: true }
}
