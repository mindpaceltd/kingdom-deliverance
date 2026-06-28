import type { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { ContactForm } from '@/components/contact/contact-form'
import { loadContactPageData } from '@/lib/cms/load-contact-page-data'
import { createClient } from '@/lib/supabase/server'
import { parsePageContent } from '@/lib/cms/page-content'
import { buildCmsPageMetadata } from '@/lib/seo/cms-page-metadata'
import { DEFAULT_CONTACT_HERO_IMAGE } from '@/lib/cms/contact-page-defaults'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const [pageRes] = await Promise.all([
    supabase
      .from('pages')
      .select('content_json')
      .eq('slug', 'contact')
      .eq('status', 'published')
      .maybeSingle(),
  ])

  const content = pageRes.data?.content_json
    ? parsePageContent(pageRes.data.content_json)
    : null

  return buildCmsPageMetadata({
    slug: 'contact',
    path: '/contact',
    defaultTitle: 'Contact Us',
    defaultDescription:
      'Contact Kingdom Deliverance Centre Uganda in Kampala. Service times, directions, phone, email, and prayer requests.',
    content,
    heroImageUrl: DEFAULT_CONTACT_HERO_IMAGE,
  })
}

export default async function ContactPage() {
  const data = await loadContactPageData()

  const infoItems = [
    {
      icon: <MapPin className="w-5 h-5 text-accent" />,
      label: 'Address',
      value: data.address,
    },
    {
      icon: <Phone className="w-5 h-5 text-accent" />,
      label: 'Phone',
      value: data.phones.join('\n'),
    },
    {
      icon: <Mail className="w-5 h-5 text-accent" />,
      label: 'Email',
      value: data.email,
    },
    {
      icon: <Clock className="w-5 h-5 text-accent" />,
      label: 'Service Times',
      value: data.serviceTimes,
    },
  ]

  return (
    <div className="flex flex-col">
      <section className="relative pt-48 pb-32 lg:pt-56 lg:pb-40 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${data.hero.imageUrl}')` }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="container relative z-10 text-center px-4">
          {data.hero.badge ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
              {data.hero.badge}
            </div>
          ) : null}
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight">
            {data.hero.title}
          </h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          {data.hero.subtitle ? (
            <p className="mt-6 text-white/90 text-lg md:text-xl max-w-xl mx-auto">
              {data.hero.subtitle}
            </p>
          ) : null}
        </div>
      </section>

      {data.introHtml ? (
        <section className="py-10 bg-white">
          <div
            className="container px-4 max-w-3xl mx-auto prose prose-primary"
            dangerouslySetInnerHTML={{ __html: data.introHtml }}
          />
        </section>
      ) : null}

      <section className="py-20 bg-white">
        <div className="container px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-3xl font-bold text-primary mb-6">
                  {data.findUsTitle}
                </h2>
                <div className="space-y-6">
                  {infoItems.map((item) => (
                    <div key={item.label} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-primary">{item.label}</p>
                        <p className="text-primary/70 whitespace-pre-line mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden shadow-lg bg-muted">
                <div className="h-72">
                  <iframe
                    src={data.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Church location map"
                  />
                </div>
                <a
                  href={data.mapLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 bg-accent/10 hover:bg-accent/20 text-accent font-semibold text-sm transition-colors duration-200"
                >
                  <MapPin className="w-4 h-4" />
                  {data.mapLinkLabel}
                </a>
              </div>
            </div>

            <ContactForm
              formTitle={data.formTitle}
              formSuccessTitle={data.formSuccessTitle}
              formSuccessMessage={data.formSuccessMessage}
              submitButtonLabel={data.submitButtonLabel}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
