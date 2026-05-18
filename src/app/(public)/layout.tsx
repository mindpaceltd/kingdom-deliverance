import { headers } from 'next/headers'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartProvider } from '@/lib/cart-context'
import { getExchangeRates } from '@/lib/services/exchange-rates'
import { CurrencyProvider } from '@/lib/currency-context'
import { createClient } from '@/lib/supabase/server'

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
  const supabase = createClient()
  
  // Fetch logo from both site_settings and organization_images for maximum compatibility
  const [logoSetting, orgLogoResult] = await Promise.all([
    supabase.from('site_settings').select('value').eq('key', 'site_logo').single(),
    supabase.from('organization_images').select('url').eq('type', 'logo').eq('is_active', true).maybeSingle()
  ])
  
  const siteLogo = orgLogoResult.data?.url || logoSetting.data?.value

  return (
    <CartProvider>
      <CurrencyProvider detectedCurrency={detectedCurrency} rates={rates}>
        <Navbar logo={siteLogo} />
        <main className="flex-1 w-full max-w-full overflow-x-hidden relative">{children}</main>
        <Footer />
      </CurrencyProvider>
    </CartProvider>
  )
}
