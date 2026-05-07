'use client'

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://kdcuganda.org${item.url}`
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
    />
  )
}

// Helper function to generate breadcrumbs for different content types
export function generateBreadcrumbs(
  type: 'blog' | 'sermon' | 'event' | 'ministry' | 'product' | 'page',
  title: string,
  slug?: string
): BreadcrumbItem[] {
  const baseBreadcrumbs: BreadcrumbItem[] = [
    { name: "Home", url: "/" }
  ]

  switch (type) {
    case 'blog':
      return [
        ...baseBreadcrumbs,
        { name: "Blog", url: "/blog" },
        { name: title, url: `/blog/${slug}` }
      ]
    case 'sermon':
      return [
        ...baseBreadcrumbs,
        { name: "Sermons", url: "/sermons" },
        { name: title, url: `/sermons/${slug}` }
      ]
    case 'event':
      return [
        ...baseBreadcrumbs,
        { name: "Events", url: "/events" },
        { name: title, url: `/events/${slug}` }
      ]
    case 'ministry':
      return [
        ...baseBreadcrumbs,
        { name: "Ministries", url: "/ministries" },
        { name: title, url: `/ministries/${slug}` }
      ]
    case 'product':
      return [
        ...baseBreadcrumbs,
        { name: "Shop", url: "/shop" },
        { name: title, url: `/shop/${slug}` }
      ]
    case 'page':
      return [
        ...baseBreadcrumbs,
        { name: title, url: `/${slug}` }
      ]
    default:
      return baseBreadcrumbs
  }
}
