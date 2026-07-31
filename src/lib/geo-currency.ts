/** Default shop currency for kdcuganda.org when geo is unavailable. */
export const DEFAULT_SITE_CURRENCY = 'UGX'

const EU_COUNTRY_CODES = new Set([
  'FR',
  'DE',
  'IT',
  'ES',
  'NL',
  'BE',
  'PT',
  'AT',
  'IE',
  'FI',
  'GR',
  'LU',
  'SK',
  'SI',
  'EE',
  'LV',
  'LT',
  'CY',
  'MT',
])

/** East Africa — prices on kdcuganda.org are listed in UGX. */
const EAST_AFRICA_UGX_CODES = new Set(['UG', 'KE', 'TZ', 'RW', 'SS', 'BI', 'ET'])

/**
 * Resolve display currency from Vercel geo header (`x-vercel-ip-country`).
 *
 * kdcuganda.org is Uganda-based: East Africa and unknown geo → UGX.
 * UK → GBP, US → USD, Eurozone → EUR, other countries → USD.
 */
export function detectCurrencyFromCountry(countryCode: string | null): string {
  if (!countryCode) return DEFAULT_SITE_CURRENCY

  const code = countryCode.toUpperCase()

  if (code === 'UG' || EAST_AFRICA_UGX_CODES.has(code)) return 'UGX'
  if (code === 'GB') return 'GBP'
  if (code === 'US') return 'USD'
  if (EU_COUNTRY_CODES.has(code)) return 'EUR'

  return 'USD'
}

/** @deprecated Use detectCurrencyFromCountry — kept for reference in docs/tests. */
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  UG: 'UGX',
  KE: 'UGX',
  TZ: 'UGX',
  RW: 'UGX',
  GB: 'GBP',
  US: 'USD',
  FR: 'EUR',
  DE: 'EUR',
}
