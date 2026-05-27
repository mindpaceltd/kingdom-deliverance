import { describe, expect, it } from 'vitest'
import { computeProductSeoScore } from '../product-seo-score'

describe('computeProductSeoScore', () => {
  it('returns 100 when all checklist items pass', () => {
    const score = computeProductSeoScore({
      meta_title: 'A Strong Product Title For Search Engines',
      meta_description: 'x'.repeat(130),
      image_alt: 'Product cover',
      short_description: 'Brief summary',
      description: 'x'.repeat(301),
    })
    expect(score).toBe(100)
  })

  it('returns 0 when nothing is filled', () => {
    expect(computeProductSeoScore({})).toBe(0)
  })
})
