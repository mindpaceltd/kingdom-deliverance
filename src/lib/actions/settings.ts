'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/authz'
import { ensurePaymentGateways } from '@/lib/payments/ensure-payment-gateways'

export async function saveSettings(
  data: Record<string, string>
): Promise<{ success: true } | { error: string }> {
  const result = await requireAdmin()
  if ('error' in result) return result

  const admin = createAdminClient()

  for (const [key, value] of Object.entries(data)) {
    const { error } = await admin
      .from('site_settings')
      .upsert({ key, value }, { onConflict: 'key' })

    if (error) {
      console.error('[saveSettings] upsert error', key, error.message)
      return { error: error.message }
    }
  }

  revalidatePath('/')
  revalidatePath('/contact')
  revalidatePath('/give')
  revalidatePath('/admin/settings')

  const paymentKeys = [
    'pesapal_enabled',
    'pesapal_consumer_key',
    'pesapal_consumer_secret',
    'pesapal_mode',
    'paypal_enabled',
    'paypal_client_id',
    'paypal_secret',
    'paypal_mode',
  ]
  if (Object.keys(data).some((k) => paymentKeys.includes(k))) {
    const synced = await ensurePaymentGateways(admin)
    if ('error' in synced) {
      console.warn('[saveSettings] payment gateway sync:', synced.error)
    }
    revalidatePath('/admin/settings/payments')
  }

  return { success: true }
}

import { getPesapalAuthToken, registerPesapalIPN } from '@/lib/payments/pesapal'

/**
 * Auto-register the Pesapal IPN URL and save the returned notification_id
 * to site_settings. Returns the IPN ID on success.
 */
export async function registerPesapalIPNAction(): Promise<
  { success: true; ipnId: string } | { error: string }
> {
  const result = await requireAdmin()
  if ('error' in result) return result

  const admin = createAdminClient()

  const { data: rows } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', ['pesapal_consumer_key', 'pesapal_consumer_secret', 'pesapal_mode'])

  const map: Record<string, string> = {}
  for (const row of rows ?? []) {
    if (row.value) map[row.key] = row.value
  }

  const consumerKey = map.pesapal_consumer_key || process.env.PESAPAL_CONSUMER_KEY || ''
  const consumerSecret = map.pesapal_consumer_secret || process.env.PESAPAL_CONSUMER_SECRET || ''
  const mode = map.pesapal_mode || process.env.PESAPAL_MODE || 'live'

  try {
    const token = await getPesapalAuthToken(consumerKey, consumerSecret, mode)
    const ipnResponse = await registerPesapalIPN(token, mode)

    const ipnId =
      ipnResponse.ipn_id ||
      ipnResponse.notification_id ||
      ipnResponse.id ||
      ipnResponse.ipnId

    if (!ipnId) {
      return {
        error: `IPN registration returned no ID. Response: ${JSON.stringify(ipnResponse).slice(0, 300)}`,
      }
    }

    // Save to DB
    await admin
      .from('site_settings')
      .upsert({ key: 'pesapal_ipn_id', value: String(ipnId) }, { onConflict: 'key' })

    return { success: true, ipnId: String(ipnId) }
  } catch (err: any) {
    return { error: err?.message || 'IPN registration failed' }
  }
}

import { sendSystemEmail } from '@/lib/email'

/**
 * Send a test email to verify SMTP settings are correct.
 */
export async function testSMTPAction(
  toEmail: string
): Promise<{ success: true; messageId?: string } | { error: string }> {
  const result = await requireAdmin()
  if ('error' in result) return result

  if (!toEmail || !toEmail.includes('@')) {
    return { error: 'Please enter a valid email address' }
  }

  const subject = 'Test SMTP Configuration - KDC Uganda'
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #1e3a5f; margin-top: 0;">SMTP Configuration Success! ✓</h2>
      <p style="font-size: 16px; color: #334155; line-height: 1.5;">This is a test email sent from <strong>Kingdom Deliverance Centre Uganda</strong> to verify that your custom SMTP server settings are working properly.</p>
      <p style="font-size: 14px; color: #64748b;">If you received this message, your Nodemailer integration is configured correctly and ready to send transaction, order, and notification emails!</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">© Kingdom Deliverance Centre Uganda</p>
    </div>
  `
  const text = 'SMTP Configuration Test\n\nCongratulations!\nThis is a test email sent from Kingdom Deliverance Centre Uganda to verify that your custom SMTP server settings are working properly.'

  try {
    const mailResult = await sendSystemEmail(toEmail, subject, html, text)
    if ('error' in mailResult) {
      return { error: mailResult.error }
    }
    return { success: true, messageId: mailResult.messageId }
  } catch (err: any) {
    return { error: err?.message || 'SMTP test execution failed' }
  }
}

