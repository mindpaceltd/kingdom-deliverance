'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/authz'
import type { Donation } from '@/lib/types'

export interface DonationTransactionRow {
  id: string
  donation_id: string
  gateway: string
  reference: string
  amount: number
  currency: string
  status: string
  created_at: string
  updated_at: string
}

export type DonationWithTransactions = Donation & {
  transactions?: DonationTransactionRow[]
}

export async function listAdminDonations(): Promise<DonationWithTransactions[]> {
  const auth = await requireAdmin()
  if ('error' in auth) return []

  const admin = createAdminClient()
  const { data: donations, error } = await admin
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[listAdminDonations]', error.message)
    return []
  }

  const rows = (donations ?? []) as Donation[]
  if (!rows.length) return []

  const ids = rows.map((d) => d.id)
  let txs: DonationTransactionRow[] = []
  const { data: txData, error: txError } = await admin
    .from('donation_transactions')
    .select('id, donation_id, gateway, reference, amount, currency, status, created_at, updated_at')
    .in('donation_id', ids)
    .order('created_at', { ascending: false })

  if (txError) {
    console.warn('[listAdminDonations] transactions unavailable:', txError.message)
  } else {
    txs = (txData ?? []) as DonationTransactionRow[]
  }

  const byDonation = new Map<string, DonationTransactionRow[]>()
  for (const tx of txs) {
    const list = byDonation.get(tx.donation_id as string) ?? []
    list.push(tx as DonationTransactionRow)
    byDonation.set(tx.donation_id as string, list)
  }

  return rows.map((d) => ({
    ...d,
    transactions: byDonation.get(d.id) ?? [],
  }))
}

export async function updateDonationStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'failed'
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const admin = createAdminClient()
  const { error } = await admin.from('donations').update({ status }).eq('id', id)

  if (error) {
    console.error('[updateDonationStatus]', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin/donations')
  return { success: true }
}

export async function getAdminDonation(id: string): Promise<DonationWithTransactions | null> {
  const auth = await requireAdmin()
  if ('error' in auth) return null

  const admin = createAdminClient()
  const { data: donation, error } = await admin
    .from('donations')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !donation) return null

  const { data: txs } = await admin
    .from('donation_transactions')
    .select('id, donation_id, gateway, reference, amount, currency, status, created_at, updated_at')
    .eq('donation_id', id)
    .order('created_at', { ascending: false })

  return {
    ...(donation as Donation),
    transactions: (txs ?? []) as DonationTransactionRow[],
  }
}
