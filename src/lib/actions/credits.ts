'use server'

import { convertGbpToCurrency, creditsToGbpAmount } from '@/lib/credits/pricing'
import { getCreditSettings } from '@/lib/credits/settings'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getExchangeRates } from '@/lib/services/exchange-rates'
import { revalidatePath } from 'next/cache'

export type CreditPackageWithPricing = {
  id: string
  name: string
  credits_amount: number
  price_usd: number
  is_active: boolean
  gbp_total: number
  charge_amount: number
  charge_currency: string
}

export async function ensureUserCreditWallet(email: string): Promise<number> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return 0

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('email', normalized)
    .maybeSingle()

  if (existing) return existing.balance ?? 0

  const settings = await getCreditSettings()
  const bonus = settings.newUserBonus

  const { error: walletError } = await supabase.from('user_credits').insert({
    email: normalized,
    balance: bonus,
    lifetime_earned: bonus,
    lifetime_spent: 0,
  })

  if (walletError) {
    console.error('[ensureUserCreditWallet]', walletError.message)
    return 0
  }

  if (bonus > 0) {
    await supabase.from('credit_transactions').insert({
      email: normalized,
      amount: bonus,
      transaction_type: 'welcome_bonus',
      metadata: { reason: 'New account welcome credits' },
    })
  }

  revalidatePath('/admin/credits')
  return bonus
}

export async function getUserCreditBalance(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return 0

  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('email', normalized)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') return 0
  if (data) return data.balance ?? 0

  return ensureUserCreditWallet(normalized)
}

export async function getCreditPricingContext() {
  const [settings, rates] = await Promise.all([getCreditSettings(), getExchangeRates()])
  return { settings, rates }
}

export async function getCreditPackages(): Promise<CreditPackageWithPricing[]> {
  const supabase = createClient()
  const [packagesRes, settings, rates] = await Promise.all([
    supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('credits_amount', { ascending: true }),
    getCreditSettings(),
    getExchangeRates(),
  ])

  if (packagesRes.error || !packagesRes.data) return []

  return packagesRes.data.map((pkg) => {
    const gbpTotal = creditsToGbpAmount(pkg.credits_amount, settings.pricePerCreditGbp)
    const chargeAmount = convertGbpToCurrency(
      gbpTotal,
      settings.checkoutCurrency,
      rates
    )
    return {
      ...pkg,
      gbp_total: gbpTotal,
      charge_amount: chargeAmount,
      charge_currency: settings.checkoutCurrency,
    }
  })
}

export async function getServicePricing(serviceName: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('service_pricing')
    .select('credit_cost')
    .eq('service_key', serviceName)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return 270
  return data.credit_cost ?? 270
}

export async function spendCredits({
  email,
  amount,
  type,
  referenceId,
}: {
  email: string
  amount: number
  type: string
  referenceId?: string
}) {
  const supabase = createAdminClient()
  const normalized = email.trim().toLowerCase()

  const { data: credit, error: fetchError } = await supabase
    .from('user_credits')
    .select('balance, lifetime_spent')
    .eq('email', normalized)
    .single()

  if (fetchError) return { success: false, error: 'User wallet not found.' }
  if (credit.balance < amount) return { success: false, error: 'Insufficient credits.' }

  const newBalance = credit.balance - amount
  const newLifetimeSpent = (credit.lifetime_spent || 0) + amount

  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      balance: newBalance,
      lifetime_spent: newLifetimeSpent,
      updated_at: new Date().toISOString(),
    })
    .eq('email', normalized)

  if (updateError) return { success: false, error: updateError.message }

  await supabase.from('credit_transactions').insert({
    email: normalized,
    amount: -amount,
    transaction_type: 'spend',
    reference_id: referenceId,
    metadata: { service_type: type },
  })

  revalidatePath('/admin/credits')
  return { success: true }
}

async function initiateCreditPurchase({
  email,
  credits,
  label,
  metadata,
}: {
  email: string
  credits: number
  label: string
  metadata: Record<string, unknown>
}) {
  const supabase = createAdminClient()
  const normalized = email.trim().toLowerCase()

  if (!normalized || credits < 1) {
    return { success: false as const, error: 'Invalid credit purchase.' }
  }

  const [settings, rates] = await Promise.all([getCreditSettings(), getExchangeRates()])
  const gbpTotal = creditsToGbpAmount(credits, settings.pricePerCreditGbp)
  const chargeAmount = convertGbpToCurrency(gbpTotal, settings.checkoutCurrency, rates)

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
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kdcuganda.org')

  try {
    const { getPesapalAuthToken, initiatePesapalPayment } = await import('@/lib/payments/pesapal')
    const token = await getPesapalAuthToken(consumerKey, consumerSecret, mode)

    const txRef = `CREDITS-${Date.now()}`
    const psaResponse = await initiatePesapalPayment(
      {
        id: txRef,
        amount: chargeAmount,
        currency: settings.checkoutCurrency,
        description: label,
        callback_url: `${siteUrl}/api/payments/verify?gateway=pesapal&type=credits`,
        notification_id: ipnId,
        billing_address: {
          email_address: normalized,
          phone_number: '',
          first_name: 'Credits',
          last_name: 'Purchase',
        },
      },
      token,
      mode
    )

    const reference = psaResponse.order_tracking_id || txRef
    const paymentUrl = psaResponse.redirect_url || psaResponse.payment_url || psaResponse.url

    if (reference && paymentUrl) {
      await supabase.from('credit_transactions').insert({
        email: normalized,
        amount: credits,
        transaction_type: 'purchase',
        reference_id: reference,
        metadata: {
          ...metadata,
          gateway: 'pesapal',
          status: 'pending',
          credits,
          gbp_total: gbpTotal,
          price_per_credit_gbp: settings.pricePerCreditGbp,
          charge_amount: chargeAmount,
          charge_currency: settings.checkoutCurrency,
        },
      })

      return { success: true as const, paymentUrl }
    }

    return { success: false as const, error: psaResponse.message || 'Failed to initiate payment.' }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to initiate payment.'
    console.error('[purchaseCredits] Error:', message)
    return { success: false as const, error: message }
  }
}

export async function purchaseCredits({ email, packageId }: { email: string; packageId: string }) {
  const supabase = createAdminClient()

  const { data: pkg, error: pkgError } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('id', packageId)
    .single()

  if (pkgError || !pkg) return { success: false, error: 'Credit package not found.' }

  return initiateCreditPurchase({
    email,
    credits: pkg.credits_amount,
    label: `${pkg.credits_amount} Credits — ${pkg.name} Package`,
    metadata: {
      package_id: packageId,
      package_name: pkg.name,
    },
  })
}

/** Buy an exact credit amount (e.g. custom seed shortfall) using admin pricing rules. */
export async function purchaseCustomCredits({
  email,
  credits,
}: {
  email: string
  credits: number
}) {
  return initiateCreditPurchase({
    email,
    credits: Math.ceil(credits),
    label: `${Math.ceil(credits)} Credits`,
    metadata: { custom_purchase: true },
  })
}

export async function adjustUserCredits(email: string, amount: number, reason: string) {
  const supabase = createAdminClient()
  const normalized = email.trim().toLowerCase()

  const { data: credit, error: fetchError } = await supabase
    .from('user_credits')
    .select('balance, lifetime_earned, lifetime_spent')
    .eq('email', normalized)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    return { success: false, error: fetchError.message }
  }

  const currentBalance = credit?.balance || 0
  const currentEarned = credit?.lifetime_earned || 0
  const currentSpent = credit?.lifetime_spent || 0

  const newBalance = currentBalance + amount

  const { error: upsertError } = await supabase.from('user_credits').upsert(
    {
      email: normalized,
      balance: newBalance,
      lifetime_earned: amount > 0 ? currentEarned + amount : currentEarned,
      lifetime_spent: amount < 0 ? currentSpent + Math.abs(amount) : currentSpent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  )

  if (upsertError) return { success: false, error: upsertError.message }

  const { error: txError } = await supabase.from('credit_transactions').insert({
    email: normalized,
    amount,
    transaction_type: 'admin_adjustment',
    metadata: { reason },
  })

  if (txError) return { success: false, error: txError.message }

  revalidatePath('/admin/credits')
  return { success: true }
}

export async function updateRequestStatus(id: string, status: string) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('fire_service_requests').update({ status }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/credits/requests')
  return { success: true }
}
