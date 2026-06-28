import { MessageCircle } from 'lucide-react'
import { FadeInSection } from '@/components/ui/page-transition'
import { TestimoniesSection } from '@/components/home/testimonies-section'
import { TestimonySubmitForm } from '@/components/testimonies/testimony-submit-form'
import type { Metadata } from 'next'
import { buildListPageMetadata } from '@/lib/seo/list-page-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: 'Testimonies',
    description:
      'Read and share testimonies of healing, deliverance, and breakthrough from Kingdom Deliverance Centre Uganda.',
    path: '/testimonies',
    keywords: 'church testimonies Uganda, healing testimonies Kampala, deliverance testimonies KDC',
  })
}

export default function TestimoniesPage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-[#0d1b3e] pb-32 pt-48 text-white lg:pb-40 lg:pt-56">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary" />

        <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
          <FadeInSection>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-accent backdrop-blur-md">
              <MessageCircle className="h-4 w-4" />
              Share Your Story
            </div>
            <h1 className="mb-6 font-serif text-5xl font-bold leading-tight text-white md:text-6xl">
              Testimonies
            </h1>
            <p className="mx-auto max-w-2xl text-lg italic text-white/80 md:text-xl">
              &ldquo;And they overcame him by the blood of the Lamb, and by the word of their
              testimony.&rdquo; — Revelation 12:11
            </p>
          </FadeInSection>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-16 space-y-4 text-center">
            <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">
              What has God done for you?
            </h2>
            <p className="text-primary/70">
              Your testimony is a powerful tool to encourage others and glorify God. Fill out the
              form below to share your breakthrough, healing, or answered prayer.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-white p-8 shadow-2xl shadow-primary/5 md:p-12">
            <TestimonySubmitForm />
          </div>
        </div>
      </section>

      <TestimoniesSection />
    </div>
  )
}
