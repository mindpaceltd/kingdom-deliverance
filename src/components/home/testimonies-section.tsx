import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, MessageCircle, Quote } from 'lucide-react'
import Link from 'next/link'
import { getApprovedTestimonies } from '@/lib/actions/testimonies'
import type { CmsHomeDetails } from '@/lib/cms/page-content'
import { resolveHomeDetails } from '@/lib/cms/home-page-defaults'

const defaultTestimonies = [
  {
    id: 'default-1',
    name: 'Sarah K.',
    testimony:
      'Ever since I joined Kingdom Deliverance Centre, my life has completely transformed. The teachings on faith and deliverance helped my business grow tremendously!',
    location: 'Kampala, Uganda',
  },
  {
    id: 'default-2',
    name: 'David M.',
    testimony:
      'I was struggling with an illness for years, but after Bishop Climate prayed for me during the Sunday service, I received my total healing. Glory to God!',
    location: 'Entebbe, Uganda',
  },
  {
    id: 'default-3',
    name: 'Grace A.',
    testimony:
      'The Wednesday Bible study sessions have opened my eyes to the true power of the Word. My family has experienced so much peace and restoration.',
    location: 'Kosovo–Lungujja, Kampala',
  },
  {
    id: 'default-4',
    name: 'John & Mary N.',
    testimony:
      'We were praying for a financial breakthrough, and God answered us miraculously. We are now debt-free and thriving!',
    location: 'Wakiso, Uganda',
  },
]

export interface TestimoniesSectionCopy {
  badge: string
  title: string
  subtitle: string
  ctaTitle: string
  ctaBody: string
  ctaLabel: string
  ctaUrl: string
}

function copyFromHome(home?: CmsHomeDetails | null): TestimoniesSectionCopy {
  const h = resolveHomeDetails(home)
  return {
    badge: h.testimoniesBadge ?? 'Testimonies',
    title: h.testimoniesTitle ?? 'Lives Transformed',
    subtitle: h.testimoniesSubtitle ?? '',
    ctaTitle: h.testimoniesCtaTitle ?? 'Have a testimony?',
    ctaBody: h.testimoniesCtaBody ?? '',
    ctaLabel: h.testimoniesCtaLabel ?? 'Submit Your Testimony',
    ctaUrl: h.testimoniesCtaUrl ?? '/testimonies',
  }
}

export async function TestimoniesSection({ home }: { home?: CmsHomeDetails | null }) {
  const copy = copyFromHome(home)
  const fromDb = await getApprovedTestimonies(8)
  const testimonies =
    fromDb.length > 0
      ? fromDb.map((t) => ({
          id: t.id,
          name: t.name,
          testimony: t.testimony,
          location: t.location,
        }))
      : defaultTestimonies

  const marqueeItems = [...testimonies, ...testimonies, ...testimonies, ...testimonies]

  return (
    <section className="relative overflow-hidden bg-accent/5 py-24">
      <div className="container relative z-10 mb-16 space-y-4 px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          <MessageCircle className="h-3.5 w-3.5" />
          {copy.badge}
        </div>
        <h2 className="font-serif text-4xl font-bold text-primary md:text-5xl">
          {copy.title}
        </h2>
        <p className="mx-auto max-w-xl text-base text-primary/60 md:text-lg">
          {copy.subtitle}
        </p>
      </div>

      <div className="group relative flex overflow-x-hidden pb-10">
        <div className="flex w-max animate-marquee gap-6 px-3">
          {marqueeItems.map((testimony, i) => (
            <Card
              key={`card-${testimony.id}-${i}`}
              className="w-80 shrink-0 border-none bg-white shadow-md transition-shadow duration-300 hover:shadow-xl md:w-96"
            >
              <CardContent className="space-y-6 p-8">
                <Quote className="h-10 w-10 text-accent/20" />
                <p className="line-clamp-4 text-sm italic leading-relaxed text-primary/75">
                  &ldquo;{testimony.testimony}&rdquo;
                </p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="text-left">
                    <p className="font-serif font-bold text-primary">{testimony.name}</p>
                    {testimony.location && (
                      <p className="text-xs text-primary/50">{testimony.location}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `,
        }}
      />

      <div className="container relative z-10 mt-12 px-4 text-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-6 rounded-2xl border bg-white p-8 shadow-lg md:flex-row">
          <div className="space-y-2 text-left">
            <h3 className="font-serif text-2xl font-bold text-primary">{copy.ctaTitle}</h3>
            <p className="text-sm text-primary/60">{copy.ctaBody}</p>
          </div>
          <Button
            asChild
            className="shrink-0 rounded-full bg-accent px-8 py-6 font-bold text-primary shadow-xl hover:bg-accent/90"
          >
            <Link href={copy.ctaUrl} className="flex items-center gap-2">
              {copy.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
