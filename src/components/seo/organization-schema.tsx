import { createClient } from '@/lib/supabase/server'
import { getOrgLogoUrl, getOrgOgImageUrl } from '@/lib/seo/site-branding'

interface OrganizationSchemaProps {
  type?: 'Church' | 'LocalBusiness'
}

export async function OrganizationSchema({ type = 'Church' }: OrganizationSchemaProps) {
  try {
  const supabase = createClient()
  
  // Get both settings and organization images
  const [settingsResult, imagesResult] = await Promise.all([
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'site_name', 
        'tagline', 
        'contact_email', 
        'contact_phone', 
        'address',
        'social_facebook',
        'social_youtube', 
        'social_instagram',
        'site_logo'
      ]),
    supabase
      .from('organization_images')
      .select('type, url, alt_text')
      .eq('is_active', true)
  ])

  const s = new Map(settingsResult.data?.map(i => [i.key, i.value]) || [])
  const images = imagesResult.data || []

  // Get specific images from database
  const [resolvedLogoUrl, resolvedOgUrl] = await Promise.all([
    getOrgLogoUrl(),
    getOrgOgImageUrl(),
  ])
  const churchImage = images.find(img => img.type === 'church_building')?.url

  const organizationData = {
    "@context": "https://schema.org",
    "@type": type,
    "name": s.get('site_name') || "Kingdom Deliverance Centre Uganda",
    "description": s.get('tagline') || "A Branch of Kingdom Temple — Led by Bishop Climate Wiseman",
    "url": "https://kdcuganda.org",
    "logo": resolvedLogoUrl || "https://kdcuganda.org/logo.png",
    "image": resolvedOgUrl || churchImage || "https://kdcuganda.org/og-image.jpg",
    "sameAs": [
      s.get('social_facebook') || "https://facebook.com/kdcuganda",
      s.get('social_youtube') || "https://youtube.com/@bishopclimateministries",
      s.get('social_instagram') || "https://instagram.com/kdcuganda"
    ].filter(Boolean),
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": s.get('contact_phone'),
      "contactType": "customer service",
      "email": s.get('contact_email') || "info@kdcuganda.org"
    },
    "address": s.get('address') ? {
      "@type": "PostalAddress",
      "addressCountry": "UG",
      "addressLocality": "Kampala"
    } : undefined,
    "foundingDate": "2025",
    "founder": {
      "@type": "Person",
      "name": "Bishop Climate Wiseman Irungu"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Church Resources",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Sunday Services",
            "description": "Weekly worship and teaching services"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Ministry Programs",
            "description": "Various ministry programs for all ages"
          }
        }
      ]
    }
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
