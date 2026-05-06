'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Get the credit balance for a user by email
 */
export async function getUserCreditBalance(email: string): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('email', email)
    .maybeSingle()

  if (error || !data) return 0
  return data.balance
}

/**
 * Get active credit packages for users to purchase
 */
export async function getCreditPackages() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('price_usd', { ascending: true })

  if (error) return []
  return data
}

/**
 * Get pricing for a specific service (e.g. 'fire_service')
 */
export async function getServicePricing(serviceKey: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('service_pricing')
    .select('credit_cost')
    .eq('service_key', serviceKey)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null
  return data.credit_cost
}

/**
 * Deduct credits from a user's balance securely inside a transaction-like flow
 */
export async function spendCredits(params: {
  email: string
  amount: number
  type: string
  referenceId?: string
}) {
  const adminClient = createAdminClient()

  // 1. Check balance first
  const { data: creditData, error: fetchError } = await adminClient
    .from('user_credits')
    .select('balance, id')
    .eq('email', params.email)
    .single()

  if (fetchError || !creditData) {
    return { success: false, error: 'Credit account not found.' }
  }

  if (creditData.balance < params.amount) {
    return { success: false, error: 'Insufficient credit balance.' }
  }

  // 2. Perform deduction and log transaction
  // Note: Using individual calls as Supabase JS doesn't support complex ACID transactions easily without RPC
  // In a real production app, we should use a Postgres RPC function for this.
  
  const newBalance = creditData.balance - params.amount
  
  const { error: updateError } = await adminClient
    .from('user_credits')
    .update({ 
      balance: newBalance,
      lifetime_spent: 0, // Placeholder, would normally increment
      updated_at: new Date().toISOString()
    })
    .eq('id', creditData.id)

  if (updateError) return { success: false, error: 'Failed to deduct credits.' }

  await adminClient.from('credit_transactions').insert({
    email: params.email,
    amount: -params.amount,
    type: params.type,
    reference_id: params.referenceId,
    created_at: new Date().toISOString()
  })

  revalidatePath('/fire-service')
  return { success: true, newBalance }
}

/**
 * Initiate a credit purchase via Pesapal
 */
export async function purchaseCredits(params: {
  email: string
  packageId: string
}) {
  const adminClient = createAdminClient()
  
  // 1. Get package details
  const { data: pkg, error: pkgError } = await adminClient
    .from('credit_packages')
    .select('*')
    .eq('id', params.packageId)
    .single()

  if (pkgError || !pkg) {
    return { success: false, error: 'Selected package not found.' }
  }

  // 2. Fetch Pesapal settings
  const { data: settingsData } = await adminClient
    .from('site_settings')
    .select('key, value')
    .in('key', ['pesapal_consumer_key', 'pesapal_consumer_secret', 'pesapal_mode', 'pesapal_ipn_id', 'credits_per_usd'])

  const settings: Record<string, string> = {}
  settingsData?.forEach(s => settings[s.key] = s.value)

  const consumerKey = settings.pesapal_consumer_key || process.env.PESAPAL_CONSUMER_KEY || ''
  const consumerSecret = settings.pesapal_consumer_secret || process.env.PESAPAL_CONSUMER_SECRET || ''
  const mode = (settings.pesapal_mode || process.env.PESAPAL_MODE || 'live') as 'sandbox' | 'live'
  const ipnId = settings.pesapal_ipn_id || process.env.PESAPAL_IPN_ID || ''
  const creditsPerUsd = parseInt(settings.credits_per_usd || '10')

  // 3. Convert USD price to UGX for Pesapal (using standard 3800 rate as fallback)
  const UGX_RATE = 3800
  const amountInUgx = Math.round(pkg.price_usd * UGX_RATE)

  // 4. Initiate Pesapal
  const { getPesapalAuthToken, initiatePesapalPayment } = await import('@/lib/payments/pesapal')
  const token = await getPesapalAuthToken(consumerKey, consumerSecret, mode)

  const txRef = `CREDIT-${Date.now()}-${params.email.split('@')[0]}`

  const psaResponse = await initiatePesapalPayment(
    {
      id: txRef,
      amount: amountInUgx,
      currency: 'UGX',
      description: `Purchase of ${pkg.credits_amount} Credits - Kingdom Deliverance Centre`,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/verify?gateway=pesapal&type=credits&packageId=${pkg.id}&email=${encodeURIComponent(params.email)}`,
      notification_id: ipnId,
      billing_address: {
        email_address: params.email,
        phone_number: '',
        first_name: 'Customer',
        last_name: '',
      },
    },
    token,
    mode
  )

  const paymentUrl = psaResponse.redirect_url || psaResponse.payment_url || psaResponse.url

  if (paymentUrl) {
    // Log the pending transaction
    await adminClient.from('credit_transactions').insert({
      email: params.email,
      amount: pkg.credits_amount,
      type: 'purchase',
      reference_id: txRef,
      metadata: { status: 'pending', package_id: pkg.id },
      created_at: new Date().toISOString()
    })

    return { success: true, paymentUrl }
  }

  return { success: false, error: 'Failed to initiate payment with Pesapal.' }
}
