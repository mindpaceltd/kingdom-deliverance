import { headers } from 'next/headers'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartProvider } from '@/lib/cart-context'
import { getExchangeRates } from '@/lib/services/exchange-rates'
import { CurrencyProvider } from '@/lib/currency-context'

// ─── Geo-detection ────────────────────────────────────────────────────────────

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // East Africa
  UG: 'UGX',
  KE: 'KES',
  TZ: 'TZS',
  RW: 'RWF',
  // West Africa
  NG: 'NGN',
  GH: 'GHS',
  // Southern Africa
  ZA: 'ZAR',
  // English-speaking
  GB: 'GBP',
  US: 'USD',
  // Eurozone
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  PT: 'EUR',
  AT: 'EUR',
}

function detectCurrency(countryCode: string | null): string {
  if (!countryCode) return 'USD'
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] ?? 'USD'
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const countryCode = headers().get('x-vercel-ip-country')
  const detectedCurrency = detectCurrency(countryCode)
  const rates = await getExchangeRates()

  return (
    <CartProvider>
      <CurrencyProvider detectedCurrency={detectedCurrency} rates={rates}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </CurrencyProvider>
    </CartProvider>
  )
}
