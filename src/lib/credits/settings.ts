import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  CREDIT_SETTING_KEYS,
  DEFAULT_CREDIT_SETTINGS,
} from '@/lib/credits/pricing'
import { SUPPORTED_CURRENCIES } from '@/lib/services/exchange-rates'

export type CreditSettings = {
  pricePerCreditGbp: number
  newUserBonus: number
  checkoutCurrency: string
}

function parsePositiveNumber(value: string | null | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export async function getCreditSettings(): Promise<CreditSettings> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', Object.values(CREDIT_SETTING_KEYS))

    const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))

    const checkout =
      map[CREDIT_SETTING_KEYS.checkoutCurrency]?.trim().toUpperCase() ||
      DEFAULT_CREDIT_SETTINGS.checkoutCurrency

    return {
      pricePerCreditGbp: parsePositiveNumber(
        map[CREDIT_SETTING_KEYS.pricePerCreditGbp],
        DEFAULT_CREDIT_SETTINGS.pricePerCreditGbp
      ) || DEFAULT_CREDIT_SETTINGS.pricePerCreditGbp,
      newUserBonus: Math.floor(
        parsePositiveNumber(
          map[CREDIT_SETTING_KEYS.newUserBonus],
          DEFAULT_CREDIT_SETTINGS.newUserBonus
        )
      ),
      checkoutCurrency: (SUPPORTED_CURRENCIES as readonly string[]).includes(checkout)
        ? checkout
        : DEFAULT_CREDIT_SETTINGS.checkoutCurrency,
    }
  } catch {
    return { ...DEFAULT_CREDIT_SETTINGS }
  }
}
