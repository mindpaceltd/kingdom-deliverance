'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { formatShopPrice } from '@/lib/format-shop-price'
import { DEFAULT_SITE_CURRENCY } from '@/lib/geo-currency'

// ─── Constants (duplicated from exchange-rates.ts which is server-only) ───────

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

const STORAGE_KEY = 'kdc_currency'
/** Set when the visitor explicitly picks a currency (checkout or shop selector). */
const MANUAL_KEY = 'kdc_currency_manual'
/** Bump when default geo rules change so stale auto-detected KES resets to UGX. */
const STORAGE_VERSION = '3'
const VERSION_KEY = 'kdc_currency_v'

// ─── Context interface ────────────────────────────────────────────────────────

export interface CurrencyContextValue {
  currency: string
  rate: number
  rates: Record<string, number>
  detectedCurrency: string
  setCurrency: (code: string) => void
  resetToDetectedCurrency: () => void
  formatPrice: (usdPrice: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────

interface CurrencyProviderProps {
  children: React.ReactNode
  detectedCurrency: string
  rates: Record<string, number>
}

function resolveCurrency(detectedCurrency: string): string {
  const geoCurrency = detectedCurrency || DEFAULT_SITE_CURRENCY

  try {
    const version = localStorage.getItem(VERSION_KEY)
    if (version !== STORAGE_VERSION) {
      const wasManual = localStorage.getItem(MANUAL_KEY) === '1'
      const stored = localStorage.getItem(STORAGE_KEY)
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION)

      if (wasManual && stored && (SUPPORTED_CURRENCIES as readonly string[]).includes(stored)) {
        return stored
      }

      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(MANUAL_KEY)
      return geoCurrency
    }

    const isManual = localStorage.getItem(MANUAL_KEY) === '1'
    const stored = localStorage.getItem(STORAGE_KEY)
    if (
      isManual &&
      stored &&
      (SUPPORTED_CURRENCIES as readonly string[]).includes(stored)
    ) {
      return stored
    }

    // Drop legacy auto-selected KES from the old geo map (Uganda site → UGX).
    if (!isManual && stored === 'KES') {
      localStorage.removeItem(STORAGE_KEY)
      return geoCurrency
    }
  } catch {
    // localStorage unavailable — use geo
  }

  return geoCurrency
}

export function CurrencyProvider({
  children,
  detectedCurrency,
  rates,
}: CurrencyProviderProps) {
  const geoCurrency = detectedCurrency || DEFAULT_SITE_CURRENCY

  const [activeCurrency, setActiveCurrency] = useState<string>(geoCurrency)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setActiveCurrency(resolveCurrency(detectedCurrency))
    setMounted(true)
  }, [detectedCurrency])

  const setCurrency = useCallback((code: string) => {
    setActiveCurrency(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
      localStorage.setItem(MANUAL_KEY, '1')
    } catch {
      // localStorage unavailable — state update still applies
    }
  }, [])

  const resetToDetectedCurrency = useCallback(() => {
    setActiveCurrency(geoCurrency)
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(MANUAL_KEY)
    } catch {
      // ignore
    }
  }, [geoCurrency])

  const displayCurrency = mounted ? activeCurrency : geoCurrency
  const displayRate = rates[displayCurrency] || FALLBACK_RATES[displayCurrency] || 1

  const value: CurrencyContextValue = {
    currency: displayCurrency,
    rate: displayRate,
    rates,
    detectedCurrency: geoCurrency,
    setCurrency,
    resetToDetectedCurrency,
    formatPrice: (usdPrice: number) =>
      formatShopPrice(usdPrice, displayCurrency, displayRate),
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
