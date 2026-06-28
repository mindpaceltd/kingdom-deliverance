import { createClient } from '@/lib/supabase/server'
import { getOrgLogoUrl, getOrgOgImageUrl } from '@/lib/seo/site-branding'
import { buildChurchOpeningHoursSpecification } from '@/lib/seo/opening-hours'
import { KDC_KAMPALA_GEO, parseChurchPostalAddress } from '@/lib/seo/parse-church-address'

interface OrganizationSchemaProps {
  type?: 'Church' | 'LocalBusiness'
}

export async function OrganizationSchema({ type = 'Church' }: OrganizationSchemaProps) {
  try {
    const supabase = createClient()

    const [settingsResult, imagesResult] = await Promise.all([
      supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'site_name',
          'tagline',
          'site_meta_description',
          'contact_email',
          'contact_phone',
          'address',
          'social_facebook',
          'social_youtube',
          'social_instagram',
          'site_logo',
        ]),
      supabase
        .from('organization_images')
        .select('type, url, alt_text')
        .eq('is_active', true),
    ])

    const s = new Map(settingsResult.data?.map((i) => [i.key, i.value]) || [])
    const images = imagesResult.data || []

    const [resolvedLogoUrl, resolvedOgUrl] = await Promise.all([
      getOrgLogoUrl(),
      getOrgOgImageUrl(),
    ])
    const churchImage = images.find((img) => img.type === 'church_building')?.url
    const siteName = s.get('site_name') || 'Kingdom Deliverance Centre Uganda'
    const description =
      s.get('site_meta_description') ||
      s.get('tagline') ||
      'A Pentecostal church in Kampala, Uganda — led by Bishop Climate Wiseman. Experience worship, healing, deliverance, and the transforming power of God.'
    const postal = parseChurchPostalAddress(s.get('address'))

    const organizationData = {
      '@context': 'https://schema.org',
      '@type': type,
      '@id': 'https://kdcuganda.org/#organization',
      name: siteName,
      alternateName: ['KDC Uganda', 'Kingdom Deliverance Centre'],
      description,
      url: 'https://kdcuganda.org',
      logo: resolvedLogoUrl || 'https://kdcuganda.org/logo.png',
      image: resolvedOgUrl || churchImage || 'https://kdcuganda.org/og-image.jpg',
      sameAs: [
        s.get('social_facebook') || 'https://facebook.com/kdcuganda',
        s.get('social_youtube') || 'https://youtube.com/@bishopclimateministries',
        s.get('social_instagram') || 'https://instagram.com/kdcuganda',
      ].filter(Boolean),
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: s.get('contact_phone') || '+256-700-000-000',
          contactType: 'customer support',
          email: s.get('contact_email') || 'info@kdcuganda.org',
          areaServed: 'UG',
          availableLanguage: ['English', 'Luganda'],
        },
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: postal.streetAddress,
        addressLocality: postal.addressLocality,
        addressRegion: postal.addressRegion,
        addressCountry: postal.addressCountry,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: KDC_KAMPALA_GEO.latitude,
        longitude: KDC_KAMPALA_GEO.longitude,
      },
      openingHoursSpecification: buildChurchOpeningHoursSpecification(),
      foundingDate: '2025',
      founder: {
        '@type': 'Person',
        name: 'Bishop Climate Wiseman Irungu',
        jobTitle: 'Senior Pastor & Founder',
      },
      parentOrganization: {
        '@type': 'Organization',
        name: 'Kingdom Temple',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Church Services & Ministries',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Sunday Worship Services',
              description:
                'English and Luganda Sunday services in Kampala — in person and live on YouTube.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Bible Study & Prayer',
              description: 'Wednesday Bible Study and Friday Fire Service prayer meetings.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Ministry Programs',
              description: 'Youth, worship, outreach, and family ministries for all ages.',
            },
          },
        ],
      },
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
    )
  } catch (err) {
    console.error('[OrganizationSchema] Failed to render:', err)
    return null
  }
}
