'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPesapalAuthToken, initiatePesapalPayment } from '@/lib/payments/pesapal'
async function getPesapalSettings() {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('site_settings')
    .select('key, value')
    .in('key', ['pesapal_consumer_key', 'pesapal_consumer_secret', 'pesapal_mode', 'pesapal_ipn_id'])

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.value) map[row.key] = row.value
  }

  return {
    consumerKey: map.pesapal_consumer_key || process.env.PESAPAL_CONSUMER_KEY || '',
    consumerSecret: map.pesapal_consumer_secret || process.env.PESAPAL_CONSUMER_SECRET || '',
    mode: map.pesapal_mode || process.env.PESAPAL_MODE || 'live',
    ipnId: map.pesapal_ipn_id || process.env.PESAPAL_IPN_ID || '',
  }
}

export async function createDonationOrder(data: {
  donor_name: string | null
  donor_email: string | null
  amount: number
  currency: string
  notes?: string
  is_anonymous: boolean
}) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  // Create donation record
  const { data: donation, error: donationError } = await adminClient
    .from('donations')
    .insert({
      donor_name: data.donor_name,
      donor_email: data.donor_email,
      amount: data.amount,
      currency: data.currency,
      method: 'online',
      notes: data.notes,
      is_anonymous: data.is_anonymous,
      status: 'pending',
    })
    .select()
    .single()

  if (donationError) {
    return { error: donationError.message }
  }

  const tx_ref = `DONATION-${donation.id.split('-')[0]}-${Date.now()}`

  try {
    const pesapal = await getPesapalSettings()
    const token = await getPesapalAuthToken(pesapal.consumerKey, pesapal.consumerSecret, pesapal.mode)

    const names = data.donor_name ? data.donor_name.trim().split(' ') : ['Anonymous', 'Donor']
    const firstName = names[0] || 'Anonymous'
    const lastName = names.slice(1).join(' ') || 'Donor'

    // Convert amount to UGX for Pesapal
    const RATES: Record<string, number> = {
      USD: 1, UGX: 3800, KES: 130, RWF: 1250, GBP: 0.79, EUR: 0.92, TZS: 2600, NGN: 1600, GHS: 15, ZAR: 18
    }
    const currentRate = RATES[data.currency] || 1
    const amountInUsd = data.amount / currentRate
    const amountInUgx = Math.round(amountInUsd * RATES['UGX'])

    const psaResponse = await initiatePesapalPayment(
      {
        id: tx_ref,
        amount: amountInUgx,
        currency: 'UGX',
        description: `Donation to Kingdom Deliverance Centre`,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/verify?gateway=pesapal&type=donation`,
        notification_id: pesapal.ipnId,
        billing_address: {
          email_address: data.donor_email || 'donations@kdcuganda.org',
          phone_number: '',
          first_name: firstName,
          last_name: lastName,
        },
      },
      token,
      pesapal.mode
    )

    const reference = psaResponse.order_tracking_id || tx_ref
    const paymentUrl = psaResponse.redirect_url || psaResponse.payment_url || psaResponse.url

    if (reference && paymentUrl) {
      await adminClient.from('donation_transactions').insert({
        donation_id: donation.id,
        gateway: 'pesapal',
        reference,
        amount: data.amount,
        currency: data.currency,
        status: 'pending',
      })
      return { success: true, paymentUrl }
    }

    return { error: psaResponse.message || 'Pesapal initiation failed' }
  } catch (err: any) {
    console.error('[createDonationOrder] Payment error:', err?.message)
    return { error: err?.message || 'Failed to initiate payment. Please try again.' }
  }
}
