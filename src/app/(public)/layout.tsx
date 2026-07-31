import { headers } from 'next/headers'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartProvider } from '@/lib/cart-context'
import { getExchangeRates, FALLBACK_RATES } from '@/lib/services/exchange-rates'
import { CurrencyProvider } from '@/lib/currency-context'
import { detectCurrencyFromCountry } from '@/lib/geo-currency'
import { createClient } from '@/lib/supabase/server'
import { SupportChatWidget } from '@/components/support/support-chat-widget'
import { FireServicePromoPopup } from '@/components/fire-service/fire-service-promo-popup'
import { getFireServicePromoPayload } from '@/lib/fire-service-schedule'

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const countryCode = headers().get('x-vercel-ip-country')
  const detectedCurrency = detectCurrencyFromCountry(countryCode)

  let rates: Awaited<ReturnType<typeof getExchangeRates>>
  let siteLogo: string | undefined

  try {
    rates = await getExchangeRates()
  } catch (err) {
    console.error('[PublicLayout] Exchange rates failed:', err)
    rates = { ...FALLBACK_RATES }
  }

  try {
    const supabase = createClient()
    const [logoSetting, orgLogoResult] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'site_logo').maybeSingle(),
      supabase.from('organization_images').select('url').eq('type', 'logo').eq('is_active', true).maybeSingle(),
    ])
    siteLogo = orgLogoResult.data?.url || logoSetting.data?.value || undefined
  } catch (err) {
    console.error('[PublicLayout] Logo fetch failed:', err)
  }

  const fireServicePromo = getFireServicePromoPayload()

  return (
    <CartProvider>
      <CurrencyProvider detectedCurrency={detectedCurrency} rates={rates}>
        <Navbar logo={siteLogo} />
        <main className="flex-1 w-full max-w-full overflow-x-hidden relative">{children}</main>
        <Footer />
        {fireServicePromo.shouldShow ? (
          <FireServicePromoPopup {...fireServicePromo} />
        ) : null}
        <SupportChatWidget />
      </CurrencyProvider>
    </CartProvider>
  )
}
