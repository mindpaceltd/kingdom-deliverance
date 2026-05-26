'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/authz'
import { revalidatePath } from 'next/cache'
import { ensurePaymentGateways } from '@/lib/payments/ensure-payment-gateways'

function revalidateSettings() {
  revalidatePath('/admin/settings')
  revalidatePath('/admin/settings/shipping')
  revalidatePath('/admin/settings/taxes')
  revalidatePath('/admin/settings/payments')
  revalidatePath('/admin/settings/emails')
}

// ---------------------------------------------------------------------------
// Shipping
// ---------------------------------------------------------------------------

export interface ShippingRateInput {
  name: string
  rate_usd: number
  description?: string
  is_active: boolean
  countries: string[]
  estimated_days?: string
}

export async function saveShippingRate(
  input: ShippingRateInput,
  id?: string
): Promise<{ success: true; id: string } | { error: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const admin = createAdminClient()
  const row = {
    name: input.name.trim(),
    rate_usd: input.rate_usd,
    description: input.description?.trim() || null,
    is_active: input.is_active,
    countries: input.countries,
    estimated_days: input.estimated_days?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await admin.from('shipping_settings').update(row).eq('id', id)
    if (error) return { error: error.message }
    revalidateSettings()
    return { success: true, id }
  }

  const { data, error } = await admin
    .from('shipping_settings')
    .insert(row)
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidateSettings()
  return { success: true, id: data.id }
}

export async function deleteShippingRate(
  id: string
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const admin = createAdminClient()
  const { error } = await admin.from('shipping_settings').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateSettings()
  return { success: true }
}

// ---------------------------------------------------------------------------
// Tax
// ---------------------------------------------------------------------------

export interface TaxRateInput {
  name: string
  tax_rate: number
  description?: string
  is_active: boolean
  apply_to_shipping: boolean
  countries: string[]
}

export async function saveTaxRate(
  input: TaxRateInput,
  id?: string
): Promise<{ success: true; id: string } | { error: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const admin = createAdminClient()
  const row = {
    name: input.name.trim(),
    tax_rate: input.tax_rate,
    description: input.description?.trim() || null,
    is_active: input.is_active,
    apply_to_shipping: input.apply_to_shipping,
    countries: input.countries,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await admin.from('tax_settings').update(row).eq('id', id)
    if (error) return { error: error.message }
    revalidateSettings()
    return { success: true, id }
  }

  const { data, error } = await admin.from('tax_settings').insert(row).select('id').single()
  if (error) return { error: error.message }
  revalidateSettings()
  return { success: true, id: data.id }
}

export async function deleteTaxRate(id: string): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const admin = createAdminClient()
  const { error } = await admin.from('tax_settings').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateSettings()
  return { success: true }
}

// ---------------------------------------------------------------------------
// Payment gateways
// ---------------------------------------------------------------------------

export interface PaymentGatewayInput {
  display_name: string
  description?: string
  is_active: boolean
  test_mode: boolean
  configuration: Record<string, unknown>
}

export async function savePaymentGateway(
  id: string,
  input: PaymentGatewayInput
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const admin = createAdminClient()
  const { error } = await admin
    .from('payment_gateways')
    .update({
      display_name: input.display_name.trim(),
      description: input.description?.trim() || null,
      is_active: input.is_active,
      test_mode: input.test_mode,
      configuration: input.configuration,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateSettings()
  return { success: true }
}

export async function togglePaymentGateway(
  id: string,
  isActive: boolean
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const admin = createAdminClient()

  const { data: gateway } = await admin
    .from('payment_gateways')
    .select('gateway_name')
    .eq('id', id)
    .maybeSingle()

  const { error } = await admin
    .from('payment_gateways')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  if (gateway?.gateway_name === 'pesapal' || gateway?.gateway_name === 'paypal') {
    const settingsKey = `${gateway.gateway_name}_enabled`
    await admin.from('site_settings').upsert(
      {
        key: settingsKey,
        value: String(isActive),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
  }

  revalidateSettings()
  revalidatePath('/admin/settings')
  return { success: true }
}

/** Sync payment_gateways table from site_settings (Pesapal/PayPal in General). */
export async function syncPaymentGatewaysFromSettings(): Promise<
  { success: true } | { error: string }
> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  try {
    const admin = createAdminClient()
    await ensurePaymentGateways(admin)
    revalidateSettings()
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sync failed'
    return { error: msg }
  }
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

export interface EmailTemplateInput {
  template_name: string
  display_name: string
  subject: string
  html_content: string
  text_content?: string
  template_type: string
  is_active: boolean
  variables: string[]
}

export async function saveEmailTemplate(
  input: EmailTemplateInput,
  id?: string
): Promise<{ success: true; id: string } | { error: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const admin = createAdminClient()
  const row = {
    template_name: input.template_name.trim(),
    display_name: input.display_name.trim(),
    subject: input.subject.trim(),
    html_content: input.html_content,
    text_content: input.text_content?.trim() || null,
    template_type: input.template_type,
    is_active: input.is_active,
    variables: input.variables,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await admin.from('email_templates').update(row).eq('id', id)
    if (error) return { error: error.message }
    revalidateSettings()
    return { success: true, id }
  }

  const { data, error } = await admin.from('email_templates').insert(row).select('id').single()
  if (error) return { error: error.message }
  revalidateSettings()
  return { success: true, id: data.id }
}

export async function deleteEmailTemplate(
  id: string
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const admin = createAdminClient()
  const { error } = await admin.from('email_templates').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateSettings()
  return { success: true }
}
