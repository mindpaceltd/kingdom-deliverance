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

export type PaymentGatewayRow = {
  id: string
  gateway_name: string
  display_name: string
  description: string | null
  is_active: boolean
  test_mode: boolean
  display_order: number
}

function isMissingPaymentGatewaysTable(message: string | undefined): boolean {
  if (!message) return false
  return (
    message.includes('payment_gateways') &&
    (message.includes('schema cache') || message.includes('does not exist'))
  )
}

/** Ensure payment_gateways rows exist and reflect General → Payments site_settings. */
export async function ensurePaymentGateways(
  admin: SupabaseClient
): Promise<{ ok: true } | { error: string }> {
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

    const { data: existing, error: fetchError } = await admin
      .from('payment_gateways')
      .select('id')
      .eq('gateway_name', gateway.gateway_name)
      .maybeSingle()

    if (fetchError) {
      console.error('[ensurePaymentGateways] fetch', gateway.gateway_name, fetchError.message)
      if (isMissingPaymentGatewaysTable(fetchError.message)) {
        return {
          error:
            'Payment gateways table is missing. Run the latest database migration (repair_payment_gateways).',
        }
      }
      return { error: fetchError.message }
    }

    if (existing?.id) {
      const { error: updateError } = await admin
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

      if (updateError) {
        console.error('[ensurePaymentGateways] update', updateError.message)
        return { error: updateError.message }
      }
    } else {
      const { error: insertError } = await admin.from('payment_gateways').insert({
        gateway_name: gateway.gateway_name,
        display_name: gateway.display_name,
        description: gateway.description,
        is_active,
        test_mode,
        display_order: gateway.display_order,
        configuration: {},
      })

      if (insertError) {
        console.error('[ensurePaymentGateways] insert', insertError.message)
        return { error: insertError.message }
      }
    }
  }

  return { ok: true }
}

/** Load gateways for admin UI; syncs from site_settings first. */
export async function getPaymentGatewaysForAdmin(
  admin: SupabaseClient
): Promise<{ data: PaymentGatewayRow[]; setupError?: string }> {
  const { data: settingsRows } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', [...SETTINGS_KEYS])
  const settings = settingsMap(settingsRows)

  const ensureResult = await ensurePaymentGateways(admin)
  if ('error' in ensureResult) {
    const credentialStatus = await getPaymentGatewayCredentialStatus(admin)
    const fallback = buildFallbackGateways(credentialStatus, settings)
    if (fallback.length > 0) {
      return { data: fallback, setupError: ensureResult.error }
    }
    return { data: [], setupError: ensureResult.error }
  }

  const { data, error } = await admin
    .from('payment_gateways')
    .select(
      'id, gateway_name, display_name, description, is_active, test_mode, display_order'
    )
    .order('display_order', { ascending: true })

  if (error) {
    console.error('[getPaymentGatewaysForAdmin]', error.message)
    const credentialStatus = await getPaymentGatewayCredentialStatus(admin)
    return {
      data: buildFallbackGateways(credentialStatus, settings),
      setupError: error.message,
    }
  }

  return { data: (data ?? []) as PaymentGatewayRow[] }
}

function buildFallbackGateways(
  credentialStatus: GatewayCredentialStatus[],
  settings: Record<string, string> = {}
): PaymentGatewayRow[] {
  const byName = Object.fromEntries(credentialStatus.map((c) => [c.gateway_name, c]))

  return GATEWAY_DEFAULTS.map((g) => {
    const cred = byName[g.gateway_name]
    const configured = cred?.credentialsConfigured ?? false
    const enabled = cred?.enabledInSettings ?? false
    const modeKey = `${g.gateway_name}_mode`
    return {
      id: `fallback-${g.gateway_name}`,
      gateway_name: g.gateway_name,
      display_name: g.display_name,
      description: g.description,
      is_active: enabled || configured,
      test_mode: (settings[modeKey] || 'sandbox') !== 'live',
      display_order: g.display_order,
    }
  }).filter((g) => {
    const cred = byName[g.gateway_name]
    return cred?.credentialsConfigured || cred?.enabledInSettings
  })
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
