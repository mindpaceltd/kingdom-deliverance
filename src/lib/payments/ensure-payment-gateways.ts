import type { SupabaseClient } from '@supabase/supabase-js'

const GATEWAY_DEFAULTS = [
  {
    gateway_name: 'pesapal',
    display_name: 'Mobile Money Payment',
    description: 'Pay with mobile money or card via Pesapal',
    display_order: 1,
  },
  {
    gateway_name: 'paypal',
    display_name: 'Pay with PayPal',
    description: 'PayPal account or card',
    display_order: 2,
  },
] as const

const SETTINGS_KEYS = [
  'pesapal_enabled',
  'pesapal_consumer_key',
  'pesapal_consumer_secret',
  'pesapal_mode',
  'paypal_enabled',
  'paypal_client_id',
  'paypal_secret',
  'paypal_mode',
] as const

function settingsMap(rows: { key: string; value: string | null }[] | null) {
  const map: Record<string, string> = {}
  for (const row of rows ?? []) {
    if (row.key) map[row.key] = row.value ?? ''
  }
  return map
}

/** Ensure payment_gateways rows exist and reflect General → Payments site_settings. */
export async function ensurePaymentGateways(
  admin: SupabaseClient
): Promise<void> {
  const { data: settingsRows } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', [...SETTINGS_KEYS])

  const settings = settingsMap(settingsRows)

  const pesapalHasCredentials = Boolean(
    settings.pesapal_consumer_key?.trim() && settings.pesapal_consumer_secret?.trim()
  )
  const paypalHasCredentials = Boolean(
    settings.paypal_client_id?.trim() && settings.paypal_secret?.trim()
  )

  for (const gateway of GATEWAY_DEFAULTS) {
    const enabledKey = `${gateway.gateway_name}_enabled`
    const modeKey = `${gateway.gateway_name}_mode`
    const enabledValue = settings[enabledKey]
    const hasCredentials =
      gateway.gateway_name === 'pesapal' ? pesapalHasCredentials : paypalHasCredentials

    const is_active =
      enabledValue === 'true'
        ? true
        : enabledValue === 'false'
          ? false
          : hasCredentials
    const test_mode = (settings[modeKey] || 'sandbox') !== 'live'

    const { data: existing } = await admin
      .from('payment_gateways')
      .select('id')
      .eq('gateway_name', gateway.gateway_name)
      .maybeSingle()

    if (existing?.id) {
      await admin
        .from('payment_gateways')
        .update({
          display_name: gateway.display_name,
          description: gateway.description,
          is_active,
          test_mode,
          display_order: gateway.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await admin.from('payment_gateways').insert({
        gateway_name: gateway.gateway_name,
        display_name: gateway.display_name,
        description: gateway.description,
        is_active,
        test_mode,
        display_order: gateway.display_order,
        configuration: {},
      })
    }
  }
}

export type GatewayCredentialStatus = {
  gateway_name: string
  credentialsConfigured: boolean
  enabledInSettings: boolean
}

export async function getPaymentGatewayCredentialStatus(
  admin: SupabaseClient
): Promise<GatewayCredentialStatus[]> {
  const { data: settingsRows } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', [...SETTINGS_KEYS])

  const settings = settingsMap(settingsRows)

  return [
    {
      gateway_name: 'pesapal',
      credentialsConfigured: Boolean(
        settings.pesapal_consumer_key?.trim() && settings.pesapal_consumer_secret?.trim()
      ),
      enabledInSettings: settings.pesapal_enabled === 'true',
    },
    {
      gateway_name: 'paypal',
      credentialsConfigured: Boolean(
        settings.paypal_client_id?.trim() && settings.paypal_secret?.trim()
      ),
      enabledInSettings: settings.paypal_enabled === 'true',
    },
  ]
}
