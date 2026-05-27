'use server'

import { revalidatePath } from 'next/cache'
import { CREDIT_SETTING_KEYS } from '@/lib/credits/pricing'
import { getCreditSettings, type CreditSettings } from '@/lib/credits/settings'
import { requireAdmin } from '@/lib/authz'
import { createAdminClient } from '@/lib/supabase/server'
import { SUPPORTED_CURRENCIES } from '@/lib/services/exchange-rates'

export async function loadCreditSettingsForAdmin(): Promise<CreditSettings> {
  await requireAdmin()
  return getCreditSettings()
}

export async function saveCreditSettings(
  input: Partial<CreditSettings>
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const price = Number(input.pricePerCreditGbp)
  if (!Number.isFinite(price) || price <= 0) {
    return { error: 'Credit price must be a positive number (GBP per credit).' }
  }

  const bonus = Math.floor(Number(input.newUserBonus ?? 0))
  if (!Number.isFinite(bonus) || bonus < 0) {
    return { error: 'New user bonus must be zero or a positive whole number.' }
  }

  const currency = (input.checkoutCurrency ?? 'UGX').trim().toUpperCase()
  if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(currency)) {
    return { error: 'Checkout currency is not supported.' }
  }

  const admin = createAdminClient()
  const rows = [
    { key: CREDIT_SETTING_KEYS.pricePerCreditGbp, value: String(price) },
    { key: CREDIT_SETTING_KEYS.newUserBonus, value: String(bonus) },
    { key: CREDIT_SETTING_KEYS.checkoutCurrency, value: currency },
  ]

  for (const row of rows) {
    const { error } = await admin.from('site_settings').upsert(row, { onConflict: 'key' })
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/credits')
  revalidatePath('/fire-service')
  return { success: true }
}
