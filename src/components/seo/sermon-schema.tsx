interface SermonSchemaProps {
  title: string
  description: string
  slug: string
  datePublished: string
  preacher?: string | null
  imageUrl: string
  videoUrl?: string | null
  audioUrl?: string | null
  orgName: string
  orgLogoUrl: string
}

export function SermonSchema({
  title,
  description,
  slug,
  datePublished,
  preacher,
  imageUrl,
  videoUrl,
  audioUrl,
  orgName,
  orgLogoUrl,
}: SermonSchemaProps) {
  const pageUrl = `https://kdcuganda.org/sermons/${slug}`

  const publisher = {
    '@type': 'Organization',
    name: orgName,
    url: 'https://kdcuganda.org',
    logo: {
      '@type': 'ImageObject',
      url: orgLogoUrl,
    },
  }

  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': videoUrl ? 'VideoObject' : 'Article',
    name: title,
    headline: title,
    description,
    image: [imageUrl],
    url: pageUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    datePublished,
    publisher,
  }

  if (preacher) {
    base.author = { '@type': 'Person', name: preacher }
  }

  if (videoUrl) {
    base.contentUrl = videoUrl
    base.embedUrl = videoUrl.includes('youtube') || videoUrl.includes('youtu.be')
      ? videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')
      : videoUrl
    base.uploadDate = datePublished
  }

  if (audioUrl) {
    base.associatedMedia = {
      '@type': 'MediaObject',
      contentUrl: audioUrl,
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(base) }}
    />
  )
}
