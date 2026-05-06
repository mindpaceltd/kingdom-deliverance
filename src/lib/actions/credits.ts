'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function adjustUserCredits(email: string, amount: number, reason: string) {
  const supabase = createAdminClient()

  // 1. Get current balance
  const { data: credit, error: fetchError } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('email', email)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    return { error: fetchError.message }
  }

  const currentBalance = credit?.balance || 0
  const newBalance = currentBalance + amount

  // 2. Upsert user_credits
  const { error: upsertError } = await supabase
    .from('user_credits')
    .upsert({
      email,
      balance: newBalance,
      lifetime_earned: amount > 0 ? (credit?.lifetime_earned || 0) + amount : (credit?.lifetime_earned || 0),
      lifetime_spent: amount < 0 ? (credit?.lifetime_spent || 0) + Math.abs(amount) : (credit?.lifetime_spent || 0),
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' })

  if (upsertError) return { error: upsertError.message }

  // 3. Record transaction
  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      email,
      amount,
      transaction_type: 'admin_adjustment',
      metadata: { reason }
    })

  if (txError) return { error: txError.message }

  revalidatePath('/admin/credits')
  return { success: true }
}

export async function updateRequestStatus(id: string, status: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('fire_service_requests')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/credits/requests')
  return { success: true }
}
