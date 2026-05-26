import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'

// ─── Constants ───────────────────────────────────────────────────────────────

export const SUPPORTED_CURRENCIES = [
  'UGX', 'KES', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR', 'GBP', 'EUR', 'USD',
] as const

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]

export const FALLBACK_RATES: Record<string, number> = {
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

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// ─── Internal types ───────────────────────────────────────────────────────────

interface RateCache {
  rates: Record<string, number>
  fetchedAt: string // ISO 8601 UTC timestamp
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isCacheFresh(fetchedAt: string): boolean {
  const age = Date.now() - new Date(fetchedAt).getTime()
  return age < CACHE_TTL_MS
}

function extractSupportedRates(
  conversionRates: Record<string, number>,
): Record<string, number> {
  const rates: Record<string, number> = {}
  for (const currency of SUPPORTED_CURRENCIES) {
    rates[currency] = conversionRates[currency] ?? FALLBACK_RATES[currency]
  }
  return rates
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns exchange rates (USD base) for all SUPPORTED_CURRENCIES.
 *
 * Resolution order:
 *  1. Supabase cache (if < 24 h old)
 *  2. exchangerate-api.com (result is cached in Supabase)
 *  3. Stale Supabase cache (if API fails)
 *  4. FALLBACK_RATES (hardcoded)
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  // ── Task 1.4: missing API key ─────────────────────────────────────────────
  if (!process.env.EXCHANGE_RATE_API_KEY) {
    console.warn(
      '[exchange-rates] EXCHANGE_RATE_API_KEY is not set — using fallback rates',
    )
    return { ...FALLBACK_RATES }
  }

  let staleCache: Record<string, number> | null = null

  // ── Task 1.2: read cache from Supabase ────────────────────────────────────
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'exchange_rates_cache')
      .single()

    if (error) {
      // Task 1.4: cache query failure — proceed to API fetch
      console.error('[exchange-rates] Supabase cache read failed:', error.message)
    } else if (data?.value) {
      try {
        const raw = data.value
        const cached: RateCache =
          typeof raw === 'string' ? JSON.parse(raw) : (raw as RateCache)
        if (cached?.rates && isCacheFresh(cached.fetchedAt)) {
          // Cache hit — return without hitting the API
          return cached.rates
        }
        // Cache is stale — keep it as a fallback in case the API fails
        if (cached?.rates) staleCache = cached.rates
      } catch (parseErr) {
        console.error('[exchange-rates] Invalid cache JSON:', parseErr)
      }
    }
  } catch (err) {
    console.error('[exchange-rates] Unexpected error reading cache:', err)
  }

  // ── Task 1.3: fetch fresh rates from the API ──────────────────────────────
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
    )

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data = await response.json()
    const rates = extractSupportedRates(
      data.conversion_rates as Record<string, number>,
    )

    // ── Task 1.3: upsert fresh rates into Supabase cache ───────────────────
    try {
      const supabase = createAdminClient()
      const cacheValue: RateCache = {
        rates,
        fetchedAt: new Date().toISOString(),
      }
      const { error } = await supabase.from('site_settings').upsert(
        { key: 'exchange_rates_cache', value: JSON.stringify(cacheValue) },
        { onConflict: 'key' },
      )
      if (error) {
        // Task 1.4: upsert failure — log but still return fresh rates
        console.error('[exchange-rates] Cache upsert failed:', error.message)
      }
    } catch (upsertErr) {
      console.error('[exchange-rates] Unexpected error upserting cache:', upsertErr)
    }

    return rates
  } catch (fetchErr) {
    // ── Task 1.4: API fetch failure ────────────────────────────────────────
    console.error('[exchange-rates] API fetch failed:', fetchErr)

    if (staleCache) {
      console.warn('[exchange-rates] Returning stale cache as fallback')
      return staleCache
    }

    console.warn('[exchange-rates] No cache available — returning fallback rates')
    return { ...FALLBACK_RATES }
  }
}
