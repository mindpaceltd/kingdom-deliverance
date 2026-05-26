'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { SEED_TESTIMONIES } from '@/lib/data/seed-testimonies'

async function seedTestimoniesIfEmpty() {
  const admin = createAdminClient()
  const { count, error: countError } = await admin
    .from('testimonies')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('[seedTestimoniesIfEmpty] count:', countError.message)
    return
  }

  if ((count ?? 0) > 0) return

  const { error } = await admin.from('testimonies').insert(SEED_TESTIMONIES)
  if (error) console.error('[seedTestimoniesIfEmpty] insert:', error.message)
}

export interface TestimonyRecord {
  id: string
  name: string
  email: string | null
  phone: string | null
  location: string | null
  testimony: string
  media_url: string | null
  media_type: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export async function getTestimoniesForAdmin(): Promise<
  { data: TestimonyRecord[] } | { error: string }
> {
  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) return auth

  await seedTestimoniesIfEmpty()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('testimonies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getTestimoniesForAdmin]', error.message)
    return { error: error.message }
  }

  return { data: (data ?? []) as TestimonyRecord[] }
}

export type TestimonyInput = {
  name: string
  email?: string | null
  phone?: string | null
  location?: string | null
  testimony: string
  media_url?: string | null
  media_type?: string | null
  status: 'pending' | 'approved' | 'rejected'
}

function normalizeTestimonyInput(input: TestimonyInput) {
  const name = input.name.trim()
  const testimony = input.testimony.trim()
  if (!name) return { error: 'Name is required' } as const
  if (!testimony) return { error: 'Testimony text is required' } as const
  return {
    name,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    location: input.location?.trim() || null,
    testimony,
    media_url: input.media_url?.trim() || null,
    media_type: input.media_type?.trim() || null,
    status: input.status,
    updated_at: new Date().toISOString(),
  } as const
}

export async function createTestimony(
  input: TestimonyInput
): Promise<{ data: TestimonyRecord } | { error: string }> {
  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) return auth

  const row = normalizeTestimonyInput(input)
  if ('error' in row) return row

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('testimonies')
    .insert(row)
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/testimonies')
  revalidatePath('/testimonies')
  revalidatePath('/')
  return { data: data as TestimonyRecord }
}

export async function updateTestimony(
  id: string,
  input: TestimonyInput
): Promise<{ data: TestimonyRecord } | { error: string }> {
  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) return auth

  const row = normalizeTestimonyInput(input)
  if ('error' in row) return row

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('testimonies')
    .update(row)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/testimonies')
  revalidatePath('/testimonies')
  revalidatePath('/')
  return { data: data as TestimonyRecord }
}

export async function updateTestimonyStatus(
  id: string,
  status: 'approved' | 'rejected' | 'pending'
): Promise<{ success: true } | { error: string }> {
  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) return auth

  const admin = createAdminClient()
  const { error } = await admin
    .from('testimonies')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/testimonies')
  revalidatePath('/testimonies')
  revalidatePath('/')
  return { success: true }
}

export async function deleteTestimony(
  id: string
): Promise<{ success: true } | { error: string }> {
  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) return auth

  const admin = createAdminClient()
  const { error } = await admin.from('testimonies').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/testimonies')
  revalidatePath('/testimonies')
  revalidatePath('/')
  return { success: true }
}

/** Public: approved testimonies for home / testimonies page */
export async function getApprovedTestimonies(limit = 12) {
  await seedTestimoniesIfEmpty()

  const supabase = createClient()
  const { data, error } = await supabase
    .from('testimonies')
    .select('id, name, testimony, location, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getApprovedTestimonies]', error.message)
    return []
  }

  return data ?? []
}
