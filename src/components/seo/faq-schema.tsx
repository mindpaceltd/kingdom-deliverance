interface FaqSchemaItem {
  question: string
  answer: string
}

interface FaqSchemaProps {
  items: FaqSchemaItem[]
}

export function FaqSchema({ items }: FaqSchemaProps) {
  if (items.length === 0) return null

  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
    />
  )
}
