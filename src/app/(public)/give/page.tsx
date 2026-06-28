import { createClient } from '@/lib/supabase/server'
import { QrCodesDisplay } from '@/components/give/qr-codes-display'
import type { Metadata } from 'next'
import { buildListPageMetadata } from '@/lib/seo/list-page-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: 'Give & Donate',
    description:
      'Give and support Kingdom Deliverance Centre Uganda via QR codes, mobile money, and secure online donations.',
    path: '/give',
    keywords: 'give KDC Uganda, church donations Uganda, tithe Kampala church, support ministry Uganda',
  })
}

export const dynamic = 'force-dynamic'

export default async function GivePage() {
  const supabase = createClient()

  const { data: rows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['qr_codes_json', 'site_name', 'donation_instructions', 'site_logo'])

  const map: Record<string, string> = {}
  for (const row of rows ?? []) {
    if (row.value) map[row.key] = row.value
  }

  const siteName = map.site_name || 'Kingdom Deliverance Centre'
  const instructions = map.donation_instructions || ''
  const logo = map.site_logo || ''

  let qrCodes: Array<{
    id: string
    title: string
    subtitle: string
    value: string
    color: string
  }> = []

  try {
    if (map.qr_codes_json) {
      qrCodes = JSON.parse(map.qr_codes_json)
    }
  } catch {
    qrCodes = []
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] text-white">
      {/* Hero */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        {/* background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-3xl" />
        </div>

        {logo && (
          <div className="relative mx-auto mb-6 w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400/30 shadow-lg shadow-amber-500/20">
            <img src={logo} alt={siteName} className="w-full h-full object-cover" />
          </div>
        )}

        <h1 className="relative text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
          Give to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            {siteName}
          </span>
        </h1>
        <p className="relative text-white/60 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
          Your generosity fuels the mission. Scan any QR code below to give quickly and securely.
        </p>
      </section>

      {/* Optional custom instructions */}
      {instructions && (
        <section className="max-w-2xl mx-auto px-4 -mt-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
            {instructions}
          </div>
        </section>
      )}

      {/* QR Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <QrCodesDisplay qrCodes={qrCodes} />
      </section>
    </main>
  )
}
