'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserCreditBalance(email: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('email', email)
    .single()

  if (error && error.code !== 'PGRST116') return 0
  return data?.balance || 0
}

export async function getCreditPackages() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .order('amount', { ascending: true })

  if (error) return []
  return data
}

export async function getServicePricing(serviceName: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('service_pricing')
    .select('credits_required')
    .eq('service_name', serviceName)
    .single()

  if (error) return 270 // Fallback default
  return data?.credits_required || 270
}

export async function spendCredits({ email, amount, type, referenceId }: {
  email: string,
  amount: number,
  type: string,
  referenceId?: string
}) {
  const supabase = createAdminClient()

  // Check balance
  const { data: credit, error: fetchError } = await supabase
    .from('user_credits')
    .select('balance, lifetime_spent')
    .eq('email', email)
    .single()

  if (fetchError) return { success: false, error: 'User wallet not found.' }
  if (credit.balance < amount) return { success: false, error: 'Insufficient credits.' }

  const newBalance = credit.balance - amount
  const newLifetimeSpent = (credit.lifetime_spent || 0) + amount

  // Update balance
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({ 
      balance: newBalance, 
      lifetime_spent: newLifetimeSpent,
      updated_at: new Date().toISOString()
    })
    .eq('email', email)

  if (updateError) return { success: false, error: updateError.message }

  // Record transaction
  await supabase
    .from('credit_transactions')
    .insert({
      email,
      amount: -amount,
      transaction_type: 'spend',
      reference_id: referenceId,
      metadata: { service_type: type }
    })

  revalidatePath('/admin/credits')
  return { success: true }
}

export async function purchaseCredits(email: string, packageId: string) {
  // This would normally integrate with a payment gateway
  // For now, it's a placeholder or needs actual implementation
  return { success: false, error: 'Payment integration required.' }
}

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
