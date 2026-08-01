export type PostCategory =
  | 'sermons'
  | 'teachings'
  | 'testimonies'
  | 'news'
  | 'bishop'
  | 'general'

export const BLOG_CATEGORIES: { label: string; value: PostCategory | '' }[] = [
  { label: 'All Posts', value: '' },
  { label: 'Sermons', value: 'sermons' },
  { label: 'Teachings', value: 'teachings' },
  { label: 'Testimonies', value: 'testimonies' },
  { label: 'Ministry News', value: 'news' },
  { label: 'Bishop Insights', value: 'bishop' },
]

export function categoryLabel(value: string | null | undefined): string {
  const found = BLOG_CATEGORIES.find((c) => c.value === value)
  if (found) return found.label
  return postTypeLabel(value)
}

export function postTypeLabel(type: string | null | undefined): string {
  if (type === 'news') return 'Ministry News'
  if (type === 'blog') return 'Blog'
  if (!type) return 'Article'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function buildBlogHref(params: {
  page?: number
  q?: string
  category?: string
  tag?: string
}): string {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.category) sp.set('category', params.category)
  if (params.tag) sp.set('tag', params.tag)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return qs ? `/blog?${qs}` : '/blog'
}
