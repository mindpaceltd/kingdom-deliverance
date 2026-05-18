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

export async function purchaseCredits({ email, packageId }: { email: string; packageId: string }) {
  const supabase = createAdminClient()

  // Fetch the package
  const { data: pkg, error: pkgError } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('id', packageId)
    .single()

  if (pkgError || !pkg) return { success: false, error: 'Credit package not found.' }

  // Load Pesapal settings
  const { data: settingsRows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['pesapal_consumer_key', 'pesapal_consumer_secret', 'pesapal_mode', 'pesapal_ipn_id'])

  const map: Record<string, string> = {}
  for (const row of settingsRows ?? []) {
    if (row.value) map[row.key] = row.value
  }

  const consumerKey = map.pesapal_consumer_key || process.env.PESAPAL_CONSUMER_KEY || ''
  const consumerSecret = map.pesapal_consumer_secret || process.env.PESAPAL_CONSUMER_SECRET || ''
  const mode = map.pesapal_mode || process.env.PESAPAL_MODE || 'live'
  const ipnId = map.pesapal_ipn_id || process.env.PESAPAL_IPN_ID || ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL}` || 'https://kdcuganda.org'

  try {
    const { getPesapalAuthToken, initiatePesapalPayment } = await import('@/lib/payments/pesapal')
    const token = await getPesapalAuthToken(consumerKey, consumerSecret, mode)

    const tx_ref = `CREDITS-${packageId.split('-')[0]}-${Date.now()}`
    const amountUgx = Math.round(Number(pkg.price_usd) * 3800)

    const psaResponse = await initiatePesapalPayment(
      {
        id: tx_ref,
        amount: amountUgx,
        currency: 'UGX',
        description: `${pkg.credits_amount} Credits — ${pkg.name} Package`,
        callback_url: `${siteUrl}/api/payments/verify?gateway=pesapal&type=credits`,
        notification_id: ipnId,
        billing_address: {
          email_address: email,
          phone_number: '',
          first_name: 'Credits',
          last_name: 'Purchase',
        },
      },
      token,
      mode
    )

    const reference = psaResponse.order_tracking_id || tx_ref
    const paymentUrl = psaResponse.redirect_url || psaResponse.payment_url || psaResponse.url

    if (reference && paymentUrl) {
      // Record pending credit transaction so IPN can fulfill it
      await supabase.from('credit_transactions').insert({
        email,
        amount: pkg.credits_amount,
        transaction_type: 'purchase',
        reference_id: reference,
        metadata: {
          package_id: packageId,
          package_name: pkg.name,
          price_usd: pkg.price_usd,
          gateway: 'pesapal',
          status: 'pending',
        },
      })

      return { success: true, paymentUrl }
    }

    return { success: false, error: psaResponse.message || 'Failed to initiate payment.' }
  } catch (err: any) {
    console.error('[purchaseCredits] Error:', err?.message)
    return { success: false, error: err?.message || 'Failed to initiate payment.' }
  }
}

export async function adjustUserCredits(email: string, amount: number, reason: string) {
  const supabase = createAdminClient()

  // 1. Get current balance and stats
  const { data: credit, error: fetchError } = await supabase
    .from('user_credits')
    .select('balance, lifetime_earned, lifetime_spent')
    .eq('email', email)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    return { success: false, error: fetchError.message }
  }

  const currentBalance = credit?.balance || 0
  const currentEarned = credit?.lifetime_earned || 0
  const currentSpent = credit?.lifetime_spent || 0
  
  const newBalance = currentBalance + amount

  // 2. Upsert user_credits
  const { error: upsertError } = await supabase
    .from('user_credits')
    .upsert({
      email,
      balance: newBalance,
      lifetime_earned: amount > 0 ? currentEarned + amount : currentEarned,
      lifetime_spent: amount < 0 ? currentSpent + Math.abs(amount) : currentSpent,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' })

  if (upsertError) return { success: false, error: upsertError.message }

  // 3. Record transaction
  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      email,
      amount,
      transaction_type: 'admin_adjustment',
      metadata: { reason }
    })

  if (txError) return { success: false, error: txError.message }

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
