interface EventSchemaProps {
  title: string
  description: string
  slug: string
  startDate: string
  endDate?: string | null
  location?: string | null
  imageUrl: string
  orgName: string
  orgLogoUrl: string
}

export function EventSchema({
  title,
  description,
  slug,
  startDate,
  endDate,
  location,
  imageUrl,
  orgName,
  orgLogoUrl,
}: EventSchemaProps) {
  const eventUrl = `https://kdcuganda.org/events/${slug}`

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description,
    image: [imageUrl],
    startDate,
    url: eventUrl,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: {
      '@type': 'Organization',
      name: orgName,
      url: 'https://kdcuganda.org',
      logo: orgLogoUrl,
    },
    performer: {
      '@type': 'Organization',
      name: orgName,
    },
  }

  if (endDate) jsonLd.endDate = endDate

  if (location) {
    jsonLd.location = {
      '@type': 'Place',
      name: location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Kampala',
        addressCountry: 'UG',
      },
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
