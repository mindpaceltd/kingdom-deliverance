import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/account/',
        '/cart',
        '/checkout',
        '/search',
        '/_next/',
      ],
    },
    sitemap: 'https://kdcuganda.org/sitemap.xml',
  }
}
