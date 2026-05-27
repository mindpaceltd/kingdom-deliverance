'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string
  support_conversation_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function upsertLeadFromSupport(input: {
  conversationId: string
  name: string
  email: string | null
  phone: string | null
}): Promise<{ success: true } | { error: string }> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const row = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    source: 'live_support',
    support_conversation_id: input.conversationId,
    updated_at: now,
  }

  const { data: existing } = await admin
    .from('leads')
    .select('id')
    .eq('support_conversation_id', input.conversationId)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await admin.from('leads').update(row).eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await admin.from('leads').insert(row)
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/leads')
  return { success: true }
}

export async function listLeads(): Promise<Lead[] | { error: string }> {
  const auth = await requireStaff()
  if ('error' in auth) return auth

  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return { error: error.message }
  return (data ?? []) as Lead[]
}
