import { describe, it, expect } from 'vitest'
import { escapeXml, renderSitemapXml, type SitemapEntry } from '../sitemap'

describe('sitemap', () => {
  it('escapes XML special characters in URLs', () => {
    expect(escapeXml('https://example.com/a&b')).toBe('https://example.com/a&amp;b')
  })

  it('renders valid urlset XML', () => {
    const entries: SitemapEntry[] = [
      {
        loc: 'https://kdcuganda.org/',
        lastmod: '2026-05-27T00:00:00.000Z',
        changefreq: 'weekly',
        priority: 1,
      },
      {
        loc: 'https://kdcuganda.org/blog/hello',
        lastmod: '2026-05-27T12:00:00.000Z',
        changefreq: 'monthly',
        priority: 0.7,
      },
    ]
    const xml = renderSitemapXml(entries)
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<loc>https://kdcuganda.org/blog/hello</loc>')
    expect(xml).toContain('<priority>0.7</priority>')
  })
})
