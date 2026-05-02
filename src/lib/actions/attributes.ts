'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveAttribute(data: any) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { id, name, values } = data

  if (id) {
    // Update attribute name
    const { error: attrError } = await supabase
      .from('product_attributes')
      .update({ name })
      .eq('id', id)
    
    if (attrError) return { error: attrError.message }

    // Update values: Delete old and insert new (simplest for now)
    await supabase.from('product_attribute_values').delete().eq('attribute_id', id)
    
    const valueInserts = values.filter((v: string) => v.trim() !== '').map((v: string) => ({
      attribute_id: id,
      value: v
    }))

    if (valueInserts.length > 0) {
      const { error: valError } = await supabase
        .from('product_attribute_values')
        .insert(valueInserts)
      if (valError) return { error: valError.message }
    }

  } else {
    // Create new attribute
    const { data: newAttr, error: attrError } = await supabase
      .from('product_attributes')
      .insert({ name })
      .select()
      .single()
    
    if (attrError) return { error: attrError.message }

    const valueInserts = values.filter((v: string) => v.trim() !== '').map((v: string) => ({
      attribute_id: newAttr.id,
      value: v
    }))

    if (valueInserts.length > 0) {
      const { error: valError } = await supabase
        .from('product_attribute_values')
        .insert(valueInserts)
      if (valError) return { error: valError.message }
    }
  }

  revalidatePath('/admin/products/attributes')
  return { success: true }
}

export async function deleteAttribute(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('product_attributes')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/products/attributes')
  return { success: true }
}
