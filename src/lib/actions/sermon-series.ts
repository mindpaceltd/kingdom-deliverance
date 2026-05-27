'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { revalidateSitemap } from '@/lib/seo/revalidate-sitemap'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'
import type { SermonSeries } from '@/lib/types'

function revalidateSermonPaths() {
  revalidatePath('/sermons')
  revalidatePath('/admin/sermons/series')
  revalidatePath('/')
  revalidateSitemap()
}

export async function createSermonSeries(
  data: Omit<SermonSeries, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: true; id: string } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { data: series, error } = await supabase
    .from('sermon_series')
    .insert(data)
    .select('id')
    .single()

  if (error) {
    console.error('[createSermonSeries]', error.message)
    return { error: error.message }
  }

  revalidateSermonPaths()
  return { success: true, id: series.id }
}

export async function updateSermonSeries(
  id: string,
  data: Partial<Omit<SermonSeries, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { error } = await supabase
    .from('sermon_series')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('[updateSermonSeries]', error.message)
    return { error: error.message }
  }

  revalidateSermonPaths()
  return { success: true }
}

export async function deleteSermonSeries(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.ADMIN)
  if ('error' in result) return result

  const supabase = createClient()

  const { error } = await supabase
    .from('sermon_series')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteSermonSeries]', error.message)
    return { error: error.message }
  }

  revalidateSermonPaths()
  return { success: true }
}
