const SUPPORTED_CURRENCIES = [
  'UGX',
  'KES',
  'TZS',
  'RWF',
  'NGN',
  'GHS',
  'ZAR',
  'GBP',
  'EUR',
  'USD',
] as const

type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

const FALLBACK_RATES: Record<SupportedCurrency, number> = {
  UGX: 3800,
  KES: 130,
  TZS: 2600,
  RWF: 1250,
  NGN: 1600,
  GHS: 15,
  ZAR: 18,
  GBP: 0.79,
  EUR: 0.92,
  USD: 1,
}

export const CREDIT_SETTING_KEYS = {
  pricePerCreditGbp: 'credit_price_gbp',
  newUserBonus: 'credit_new_user_bonus',
  checkoutCurrency: 'credit_checkout_currency',
} as const

export const DEFAULT_CREDIT_SETTINGS = {
  pricePerCreditGbp: 1,
  newUserBonus: 0,
  checkoutCurrency: 'UGX' as SupportedCurrency,
}

/** GBP total for a number of credits at the configured per-credit price. */
export function creditsToGbpAmount(credits: number, pricePerCreditGbp: number): number {
  if (!Number.isFinite(credits) || credits <= 0) return 0
  const unit = Number.isFinite(pricePerCreditGbp) && pricePerCreditGbp > 0 ? pricePerCreditGbp : 1
  return credits * unit
}

/**
 * Convert a GBP amount to another currency using USD-base rates.
 * Rates are units of target currency per 1 USD (same as shop checkout).
 * Rounds up to the nearest whole unit (Math.ceil).
 */
export function convertGbpToCurrency(
  gbpAmount: number,
  targetCurrency: string,
  rates: Record<string, number>
): number {
  if (gbpAmount <= 0) return 0

  const gbpRate = rates.GBP ?? FALLBACK_RATES.GBP
  const fallbackTarget =
    FALLBACK_RATES[targetCurrency as keyof typeof FALLBACK_RATES] ?? FALLBACK_RATES.USD
  const targetRate = rates[targetCurrency] ?? fallbackTarget

  const usdAmount = gbpAmount / gbpRate
  const localAmount = usdAmount * targetRate
  return Math.ceil(localAmount)
}

/** USD equivalent of a GBP amount (for CurrencyProvider formatPrice). */
export function gbpToUsdAmount(gbpAmount: number, rates: Record<string, number>): number {
  const gbpRate = rates.GBP ?? FALLBACK_RATES.GBP
  return gbpAmount / gbpRate
}
