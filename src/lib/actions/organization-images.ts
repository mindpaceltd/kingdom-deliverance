'use server'

import { createAdminClient } from '@/lib/supabase/server-actions'
import { revalidatePath } from 'next/cache'
import { uploadFile, deleteFile, getKeyFromUrl } from '@/lib/services/r2-storage'

export async function uploadOrganizationImage(
  file: File,
  type: 'logo' | 'og_image' | 'church_building' | 'leadership' | 'hero',
  altText?: string
) {
  const supabase = createAdminClient()
  
  try {
    // Convert File to Buffer for R2 SDK upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileExt = file.name.split('.').pop()
    const fileName = `${type}-${Date.now()}.${fileExt}`
    const filePath = `organization/${fileName}`
    
    // Upload to Cloudflare R2 Storage
    const r2Result = await uploadFile(filePath, buffer, file.type, 'organization-images')
    
    if ('error' in r2Result) {
      throw new Error(r2Result.error)
    }

    const publicUrl = r2Result.url

    // Insert into database
    const { error: dbError } = await supabase
      .from('organization_images')
      .insert({
        name: fileName,
        type,
        bucket: 'organization-images',
        path: filePath,
        url: publicUrl,
        alt_text: altText,
        is_active: true,
        sort_order: 0
      })

    if (dbError) throw dbError

    revalidatePath('/admin/organization-images')
    return { success: true, url: publicUrl }
    
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

export async function getOrganizationImages() {
  const supabase = createAdminClient()
  
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
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('organization_images')
    .update(updates)
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/admin/organization-images')
  return { success: true }
}

export async function deleteOrganizationImage(id: string) {
  const supabase = createAdminClient()
  
  // Get image info first
  const { data: image } = await supabase
    .from('organization_images')
    .select('path, url')
    .eq('id', id)
    .single()
  
  if (!image) throw new Error('Image not found')
  
  // Check if it's an R2 URL
  const r2Key = getKeyFromUrl(image.url || '')
  if (r2Key) {
    const { error: r2Error } = await deleteFile(r2Key, 'organization-images')
    if (r2Error) {
      console.warn('[deleteOrganizationImage] R2 delete warning:', r2Error)
    }
  } else if (image.path) {
    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('organization-images')
      .remove([image.path])
    
    if (storageError) {
      console.warn('[deleteOrganizationImage] Supabase delete warning:', storageError.message)
    }
  }
  
  // Delete from database
  const { error: dbError } = await supabase
    .from('organization_images')
    .delete()
    .eq('id', id)
  
  if (dbError) throw dbError
  
  revalidatePath('/admin/organization-images')
  return { success: true }
}
