import { createClient } from '@/lib/supabase/server'

export async function incrementEventViews(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.rpc('increment_event_views', { p_event_id: id })
}

export async function incrementMinistryViews(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.rpc('increment_ministry_views', { p_ministry_id: id })
}

export async function incrementSermonViews(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.rpc('increment_sermon_views', { p_sermon_id: id })
}