import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { parsePageContent } from '@/lib/cms/page-content'
import {
  DEFAULT_FAQ_HERO_IMAGE,
  resolveFaqDetails,
} from '@/lib/cms/faq-page-defaults'
import { normalizeMediaUrl } from '@/lib/media-url'
import { buildCmsPageMetadata } from '@/lib/seo/cms-page-metadata'
import { FaqSchema } from '@/components/seo/faq-schema'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('pages')
    .select('content_json')
    .eq('slug', 'faq')
    .eq('status', 'published')
    .maybeSingle()

  const content = data?.content_json ? parsePageContent(data.content_json) : null

  return buildCmsPageMetadata({
    slug: 'faq',
    path: '/faq',
    defaultTitle: 'Frequently Asked Questions',
    defaultDescription:
      'Answers about Kingdom Deliverance Centre Uganda — service times in Kampala, giving, live stream, ministries, and how to visit our church.',
    content,
    heroImageUrl: normalizeMediaUrl(content?.hero?.imageUrl) || DEFAULT_FAQ_HERO_IMAGE,
  })
}

export default async function FaqPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('pages')
    .select('content_json')
    .eq('slug', 'faq')
    .eq('status', 'published')
    .maybeSingle()

  const content = data?.content_json ? parsePageContent(data.content_json) : null
  const faq = resolveFaqDetails(content?.faq)
  const sections = faq.sections ?? []
  const heroTitle = content?.hero?.title?.trim() || 'Frequently Asked Questions'
  const heroIntro = faq.intro?.trim() || content?.hero?.subtitle?.trim() || ''
  const heroImage =
    normalizeMediaUrl(content?.hero?.imageUrl) || DEFAULT_FAQ_HERO_IMAGE

  const faqSchemaItems = sections.flatMap((section) =>
    section.items.map((item) => ({
      question: item.question,
      answer: item.answer,
    }))
  )

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <FaqSchema items={faqSchemaItems} />
      <section className="relative pt-48 pb-20 lg:pt-56 lg:pb-28 text-white overflow-hidden bg-[#0d1b3e]">
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary" />

        <div className="container relative z-10 px-4 max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
            {heroTitle}
          </h1>
          {heroIntro ? (
            <p className="text-white/85 text-lg md:text-xl">{heroIntro}</p>
          ) : null}
          {faq.lastUpdated ? (
            <p className="text-white/70 text-sm mt-4">
              {faq.lastUpdatedLabel} {faq.lastUpdated}
            </p>
          ) : null}
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container px-4 max-w-4xl mx-auto space-y-10">
          {sections.map((section, sectionIndex) => (
            <div key={`${section.title}-${sectionIndex}`} className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">{section.title}</h2>
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <details
                    key={`${item.question}-${itemIndex}`}
                    className="group rounded-xl border border-border/80 bg-card px-5 py-4 open:shadow-sm"
                  >
                    <summary className="cursor-pointer list-none font-semibold text-primary flex items-start justify-between gap-4">
                      <span>{item.question}</span>
                      <span className="text-accent transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="text-primary/80 leading-relaxed mt-3 pr-6">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-border bg-muted/30 px-6 py-6 text-primary/80">
            <p className="font-semibold text-primary mb-2">{faq.helpTitle}</p>
            <p>
              {faq.helpText?.trim() ? (
                faq.helpText
              ) : (
                <>
                  {faq.helpMessageLead}{' '}
                  {faq.helpLinkLabel && faq.helpLinkUrl ? (
                    <Link href={faq.helpLinkUrl} className="text-accent hover:underline">
                      {faq.helpLinkLabel}
                    </Link>
                  ) : null}{' '}
                  {faq.helpMessageTail}
                </>
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
