/**
 * Shared helper to load Pesapal credentials from site_settings DB.
 * Falls back to environment variables if not set in DB.
 * Used by API routes and server actions.
 */
import { createAdminClient } from '@/lib/supabase/server'

export interface PesapalSettings {
  consumerKey: string
  consumerSecret: string
  mode: string
  ipnId: string
}

export async function getPesapalSettings(): Promise<PesapalSettings> {
  const supabase = createAdminClient()
  const { data } = await supabase
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
