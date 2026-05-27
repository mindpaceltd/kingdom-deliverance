import { describe, expect, it } from 'vitest'
import {
  deriveFocusKeyword,
  fitTextLength,
  normalizeAiSeoOutput,
  normalizeContentHtml,
  normalizeMetaDescription,
  normalizeSeoTitle,
} from '../normalize-ai-seo-output'
import { computeSeoScore } from '@/lib/seo-scorer'

describe('normalize-ai-seo-output', () => {
  it('fits seo title to 50–60 chars with keyword', () => {
    const kw = 'worship arts ministry'
    const title = normalizeSeoTitle('Short', kw, 'Worship Arts')
    expect(title.length).toBeGreaterThanOrEqual(50)
    expect(title.length).toBeLessThanOrEqual(60)
    expect(title.toLowerCase()).toContain('worship')
  })

  it('fits meta description to 150–160 chars with keyword', () => {
    const kw = 'youth conference'
    const meta = normalizeMetaDescription('Brief.', kw, '', 'Youth Conference 2026')
    expect(meta.length).toBeGreaterThanOrEqual(150)
    expect(meta.length).toBeLessThanOrEqual(160)
    expect(meta.toLowerCase()).toContain('youth')
  })

  it('ensures html has 300+ words and keyword in intro', () => {
    const kw = 'prayer revival'
    const html = normalizeContentHtml('<p>Hello world.</p>', kw)
    const plain = html.replace(/<[^>]+>/g, ' ')
    const words = plain.trim().split(/\s+/).filter(Boolean)
    expect(words.length).toBeGreaterThanOrEqual(300)
    expect(html.slice(0, 200).toLowerCase()).toContain('prayer')
  })

  it('normalizeAiSeoOutput scores 90 without featured image', () => {
    const result = normalizeAiSeoOutput(
      {
        html: '<p>Test</p>',
        focusKeyword: '',
        seoTitle: 'x',
        metaDescription: 'y',
        slug: 'test',
      },
      { title: 'Sunday Worship Service Kampala', requestedKeyword: 'sunday worship' }
    )

    const { score, checks } = computeSeoScore({
      focusKeyword: result.focusKeyword!,
      seoTitle: result.seoTitle!,
      metaDescription: result.metaDescription!,
      content: result.html,
      slug: result.slug!,
      featuredImage: '',
    })

    expect(checks.keywordInTitle).toBe(true)
    expect(checks.keywordInIntro).toBe(true)
    expect(checks.metaDescriptionLength).toBe(true)
    expect(checks.seoTitleLength).toBe(true)
    expect(checks.contentWordCount).toBe(true)
    expect(checks.keywordInSlug).toBe(true)
    expect(score).toBe(90)
  })

  it('deriveFocusKeyword prefers requested keyword', () => {
    expect(deriveFocusKeyword('', 'Some Title', 'custom focus phrase')).toBe(
      'custom focus phrase'
    )
  })

  it('fitTextLength keeps keyword when trimming', () => {
    const long = 'a'.repeat(80)
    const fitted = fitTextLength(long, 'faith hope', 50, 60)
    expect(fitted.length).toBeLessThanOrEqual(60)
    expect(fitted.length).toBeGreaterThanOrEqual(50)
    expect(fitted.toLowerCase()).toContain('faith')
  })
})
