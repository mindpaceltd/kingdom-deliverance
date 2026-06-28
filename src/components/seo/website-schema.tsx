export function WebsiteSchema() {
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kingdom Deliverance Centre Uganda',
    alternateName: ['KDC Uganda', 'Kingdom Deliverance Centre'],
    url: 'https://kdcuganda.org',
    description:
      'Kingdom Deliverance Centre Uganda — a Pentecostal church in Kampala led by Bishop Climate Wiseman. Watch sermons, join live services, and grow in faith.',
    inLanguage: 'en-UG',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://kdcuganda.org/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kingdom Deliverance Centre Uganda',
      url: 'https://kdcuganda.org',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
    />
  )
}
