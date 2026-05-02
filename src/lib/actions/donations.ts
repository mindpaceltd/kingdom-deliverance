import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPesapalAuthToken, initiatePesapalPayment } from '@/lib/payments/pesapal'

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
      status: 'pending'
    })
    .select()
    .single()

  if (donationError) {
    return { error: donationError.message }
  }

  // Get user if authenticated
  const { data: { user } } = await supabase.auth.getUser()

  // Create transaction record
  const tx_ref = `DONATION-${donation.id.split('-')[0]}-${Date.now()}`

  try {
    const token = await getPesapalAuthToken()
    const names = data.donor_name ? data.donor_name.trim().split(' ') : ['Anonymous', 'Donor']
    const firstName = names[0] || 'Anonymous'
    const lastName = names.slice(1).join(' ') || 'Donor'

    const psaResponse = await initiatePesapalPayment({
      id: tx_ref,
      amount: data.amount,
      currency: data.currency,
      description: `Donation to Kingdom Deliverance Centre`,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/verify?gateway=pesapal&type=donation`,
      notification_id: process.env.PESAPAL_IPN_ID!,
      billing_address: {
        email_address: data.donor_email || 'donations@kdcuganda.org',
        phone_number: '', // Optional for donations
        first_name: firstName,
        last_name: lastName
      }
    }, token)

    const reference = psaResponse.order_tracking_id || tx_ref
    const paymentUrl = psaResponse.redirect_url || psaResponse.payment_url || psaResponse.url

    if (reference && paymentUrl) {
      await adminClient.from('donation_transactions').insert({
        donation_id: donation.id,
        gateway: 'pesapal',
        reference,
        amount: data.amount,
        currency: data.currency,
        status: 'pending'
      })
      return { success: true, paymentUrl }
    }

    return { error: psaResponse.message || 'Pesapal initiation failed' }
  } catch (err: any) {
    console.error('Donation payment exception:', err)
    return { error: 'Failed to initiate payment. Please try again.' }
  }
}