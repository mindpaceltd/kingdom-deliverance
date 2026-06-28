import type { Metadata } from 'next'
import Link from 'next/link'
import { Radio, Video, Globe, ExternalLink } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { CHURCH_LIVE_SCHEDULE } from '@/lib/church-service-times'
import { createClient } from '@/lib/supabase/server'
import { getLiveStreamConfig } from '@/lib/live-stream'
import { YouTubeLivePlayer } from '@/components/live/youtube-live-player'
import { normalizeExternalHref } from '@/lib/utils/external-url'
import { buildListPageMetadata } from '@/lib/seo/list-page-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: 'Watch Live',
    description:
      'Watch Kingdom Deliverance Centre Uganda live on YouTube. Join Sunday English and Luganda services, Bible Study, and Fire Service from Kampala.',
    path: '/live',
    keywords:
      'KDC Uganda live stream, church live Uganda, Bishop Climate live, Sunday service live Kampala, YouTube church Uganda',
  })
}

export const revalidate = 3600

export default async function LivePage() {
  const supabase = createClient()
  const { data: settingsRows } = await supabase.from('site_settings').select('key, value')
  const settings = Object.fromEntries((settingsRows ?? []).map((row) => [row.key, row.value]))
  const liveStream = await getLiveStreamConfig(settings)

  const youtubeUrl = normalizeExternalHref(
    settings.youtube_url || process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || liveStream.channelUrl,
  )
  const facebookUrl = normalizeExternalHref(settings.facebook_url || process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || '')

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden py-20 text-white md:py-40">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-black/75" />
        <div className="container relative z-10 px-4 text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-bold uppercase tracking-wider text-red-400">YouTube Live</span>
          </div>
          <h1 className="font-serif text-5xl font-bold leading-tight text-white md:text-6xl">Watch Live</h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/90 md:text-xl">
            Join us for live worship, powerful messages, and{' '}
            <span className="font-bold text-accent">encounter God</span> from wherever you are.
          </p>
        </div>
      </section>

      <section className="bg-black py-12">
        <div className="container mx-auto max-w-5xl px-4">
          <YouTubeLivePlayer config={liveStream} />
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto max-w-3xl space-y-10 px-4 text-center">
          <div>
            <h2 className="font-serif text-3xl font-bold text-primary">Service Schedule</h2>
            <p className="mt-2 text-primary/70">
              We go live on YouTube for our services. Set a reminder so you never miss a moment.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {CHURCH_LIVE_SCHEDULE.map((s) => (
              <div key={`${s.day}-${s.time}`} className="space-y-2 rounded-2xl bg-muted p-6">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                  <Radio className="h-5 w-5 text-accent" />
                </div>
                <p className="font-serif text-xl font-bold text-primary">{s.day}</p>
                <p className="font-semibold text-accent">{s.time}</p>
                <p className="text-sm text-primary/70">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <p className="font-medium text-primary/70">Also find us on:</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: 'outline',
                    className: 'gap-2 border-red-500 text-red-500 hover:bg-red-50',
                  })}
                >
                  <Video className="h-5 w-5" /> YouTube Channel <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: 'outline',
                    className: 'gap-2 border-blue-600 text-blue-600 hover:bg-blue-50',
                  })}
                >
                  <Globe className="h-5 w-5" /> Facebook <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
