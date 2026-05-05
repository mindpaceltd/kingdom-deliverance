'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

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

// ─── Context interface ────────────────────────────────────────────────────────

export interface CurrencyContextValue {
  currency: string
  rate: number
  rates: Record<string, number>
  setCurrency: (code: string) => void
  formatPrice: (usdPrice: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────

interface CurrencyProviderProps {
  children: React.ReactNode
  detectedCurrency: string
  rates: Record<string, number>
}

export function CurrencyProvider({
  children,
  detectedCurrency,
  rates,
}: CurrencyProviderProps) {
  // Start with the server-detected currency to minimise hydration mismatch.
  // The client-side priority resolution runs after mount.
  const [activeCurrency, setActiveCurrency] = useState<string>(
    detectedCurrency || 'USD',
  )
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Priority resolution: localStorage → detectedCurrency → 'USD'
    let resolved: string = detectedCurrency || 'USD'

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && (SUPPORTED_CURRENCIES as readonly string[]).includes(stored)) {
        resolved = stored
      }
    } catch {
      // localStorage unavailable (SSR, private browsing) — fall through
    }

    setActiveCurrency(resolved)
    setMounted(true)
  }, [detectedCurrency])

  const setCurrency = (code: string) => {
    setActiveCurrency(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // localStorage unavailable — state update still applies
    }
  }

  const formatPrice = (usdPrice: number): string => {
    // Guard against rate 0 or NaN
    const rate = rates[activeCurrency] || FALLBACK_RATES[activeCurrency] || 1
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: activeCurrency,
    }).format(usdPrice * rate)
  }

  const rate = rates[activeCurrency] || FALLBACK_RATES[activeCurrency] || 1

  const value: CurrencyContextValue = {
    // Before mount, expose the server-detected currency so SSR and first
    // client render agree. After mount, use the fully-resolved value.
    currency: mounted ? activeCurrency : detectedCurrency || 'USD',
    rate,
    rates,
    setCurrency,
    formatPrice,
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
