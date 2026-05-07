'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadOrganizationImage(
  file: File,
  type: 'logo' | 'og_image' | 'church_building' | 'leadership' | 'hero',
  altText?: string
) {
  const supabase = createClient()
  
  try {
    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${type}-${Date.now()}.${fileExt}`
    const filePath = `organization/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('organization-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('organization-images')
      .getPublicUrl(filePath)
    
    // Save to database
    const { error: dbError } = await supabase
      .from('organization_images')
      .insert({
        name: file.name,
        type,
        bucket: 'organization-images',
        path: filePath,
        url: publicUrl,
        alt_text: altText,
        is_active: true
      })
    
    if (dbError) throw dbError
    
    // Update site settings if this is a logo or og_image
    if (type === 'logo' || type === 'og_image') {
      await supabase
        .from('site_settings')
        .upsert({
          key: `site_${type === 'logo' ? 'logo' : 'og_image'}`,
          value: publicUrl
        })
    }
    
    revalidatePath('/admin/media')
    revalidatePath('/')
    
    return { success: true, url: publicUrl }
    
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

export async function getOrganizationImages() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('organization_images')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  
  if (error) throw error
  
  return data || []
}

export async function updateOrganizationImage(
  id: string,
  updates: {
    alt_text?: string
    is_active?: boolean
    sort_order?: number
  }
) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('organization_images')
    .update(updates)
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/admin/media')
  return { success: true }
}

export async function deleteOrganizationImage(id: string) {
  const supabase = createClient()
  
  // Get image info first
  const { data: image } = await supabase
    .from('organization_images')
    .select('path')
    .eq('id', id)
    .single()
  
  if (image?.path) {
    // Delete from storage
    await supabase.storage
      .from('organization-images')
      .remove([image.path])
  }
  
  // Delete from database
  const { error } = await supabase
    .from('organization_images')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/admin/media')
  return { success: true }
}
