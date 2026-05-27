import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  CANONICAL_SITE_ORIGIN,
  getDefaultPublicOrigin,
  getSitemapOrigin,
} from '../public-content-urls'

describe('public-content-urls', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
  })

  afterEach(() => {
    process.env = env
  })

  it('getSitemapOrigin always returns production domain', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://kingdom-deliverance.vercel.app'
    expect(getSitemapOrigin()).toBe(CANONICAL_SITE_ORIGIN)
  })

  it('getDefaultPublicOrigin ignores vercel.app env', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://kingdom-deliverance.vercel.app'
    expect(getDefaultPublicOrigin()).toBe(CANONICAL_SITE_ORIGIN)
  })

  it('getDefaultPublicOrigin uses valid custom domain from env', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.kdcuganda.org'
    expect(getDefaultPublicOrigin()).toBe('https://www.kdcuganda.org')
  })
})
