import { createClient } from '@/lib/supabase/server'

async function isAdminOrEditor(supabase: any): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    return profile?.role === 'admin' || profile?.role === 'editor'
  } catch {
    return false
  }
}

export async function incrementEventViews(id: string): Promise<void> {
  const supabase = createClient()
  if (await isAdminOrEditor(supabase)) return
  await supabase.rpc('increment_event_views', { p_event_id: id })
}

export async function incrementMinistryViews(id: string): Promise<void> {
  const supabase = createClient()
  if (await isAdminOrEditor(supabase)) return
  await supabase.rpc('increment_ministry_views', { p_ministry_id: id })
}

export async function incrementSermonViews(id: string): Promise<void> {
  const supabase = createClient()
  if (await isAdminOrEditor(supabase)) return
  await supabase.rpc('increment_sermon_views', { p_sermon_id: id })
}