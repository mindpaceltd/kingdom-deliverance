'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/authz'

export async function saveSettings(
  data: Record<string, string>
): Promise<{ success: true } | { error: string }> {
  const result = await requireAdmin()
  if ('error' in result) return result

  const supabase = createClient()

  for (const [key, value] of Object.entries(data)) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value }, { onConflict: 'key' })

    if (error) {
      console.error('[saveSettings] upsert error', key, error.message)
      return { error: error.message }
    }
  }

  revalidatePath('/')
  revalidatePath('/contact')

  return { success: true }
}
