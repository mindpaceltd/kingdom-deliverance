import { describe, it, expect } from 'vitest'
import { resolveListQuerySeo } from '../list-query-metadata'

describe('collection crawling', () => {
  it('gives subsequent pages their own canonical and title', () => {
    expect(resolveListQuerySeo('/shop', { page: '2' })).toEqual({ path: '/shop?page=2', suffix: ' — Page 2', noIndex: false })
  })
  it('keeps search, sorting and filter combinations out of the index', () => {
    expect(resolveListQuerySeo('/blog', { page: '2', q: 'prayer' })).toEqual({ path: '/blog', suffix: '', noIndex: true })
    expect(resolveListQuerySeo('/shop', { sort: 'price-asc' }).noIndex).toBe(true)
  })
  it('normalizes invalid page values without generating invalid canonicals', () => {
    for (const page of ['NaN', '-1', '2.5', 'Infinity']) expect(resolveListQuerySeo('/shop', { page }).path).toBe('/shop')
  })
})
