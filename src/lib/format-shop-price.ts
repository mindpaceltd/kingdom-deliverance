const ZERO_DECIMAL_CURRENCIES = new Set(['UGX', 'KES', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR'])

const CURRENCY_LOCALE: Record<string, string> = {
  UGX: 'en-UG',
  KES: 'en-KE',
  GBP: 'en-GB',
  USD: 'en-US',
  EUR: 'en-IE',
}

/** Format a USD base amount in the visitor's display currency. */
export function formatShopPrice(
  usdPrice: number,
  currency: string,
  rate: number,
): string {
  const amount = usdPrice * rate
  const locale = CURRENCY_LOCALE[currency] ?? 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2,
  }).format(amount)
}
