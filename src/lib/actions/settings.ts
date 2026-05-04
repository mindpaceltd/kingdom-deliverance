'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/authz'

export async function saveSettings(
  data: Record<string, string>
): Promise<{ success: true } | { error: string }> {
  const result = await requireAdmin()
  if ('error' in result) return result

  const supabase = createClient()

  for (const [key, value] of Object.entries(data)) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value }, { onConflict: 'key' })

    if (error) {
      console.error('[saveSettings] upsert error', key, error.message)
      return { error: error.message }
    }
  }

  revalidatePath('/')
  revalidatePath('/contact')

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

  const supabase = createClient()

  // Fetch credentials from DB
  const { data: rows } = await supabase
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
    await supabase
      .from('site_settings')
      .upsert({ key: 'pesapal_ipn_id', value: String(ipnId) }, { onConflict: 'key' })

    return { success: true, ipnId: String(ipnId) }
  } catch (err: any) {
    return { error: err?.message || 'IPN registration failed' }
  }
}
