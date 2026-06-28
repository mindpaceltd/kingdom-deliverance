import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/cart',
        '/checkout',
        '/account/',
        '/search',
      ],
    },
    sitemap: 'https://kdcuganda.org/sitemap.xml',
  }
}
