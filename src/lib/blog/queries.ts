import { createClient } from '@/lib/supabase/server'
import type { PostCategory } from '@/lib/blog/catalog'

export const POSTS_PER_PAGE = 10

export interface BlogListPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  type: string
  category: string | null
  published_at: string | null
  views: number | null
  content: string | null
  profiles: { name: string | null } | { name: string | null }[] | null
}

let categoryColumnAvailable: boolean | null = null

async function postsSupportCategory(): Promise<boolean> {
  if (categoryColumnAvailable !== null) return categoryColumnAvailable
  const supabase = createClient()
  const { error } = await supabase.from('posts').select('category').limit(1)
  categoryColumnAvailable = !error
  return categoryColumnAvailable
}

function publishedPostsQuery() {
  const supabase = createClient()
  return supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('deleted_at', null)
}

export async function getBlogCategoryCounts(): Promise<Record<string, number>> {
  const hasCategory = await postsSupportCategory()
  const supabase = createClient()

  const { count: total } = await publishedPostsQuery()
  const counts: Record<string, number> = { '': total ?? 0 }

  if (hasCategory) {
    for (const cat of ['sermons', 'teachings', 'testimonies', 'news', 'bishop', 'general'] as PostCategory[]) {
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .is('deleted_at', null)
        .eq('category', cat)
      counts[cat] = count ?? 0
    }
    return counts
  }

  // Fallback before category migration: map by post type
  const { count: blogCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('deleted_at', null)
    .eq('type', 'blog')

  const { count: newsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('deleted_at', null)
    .eq('type', 'news')

  counts.teachings = blogCount ?? 0
  counts.news = newsCount ?? 0
  counts.bishop = blogCount ?? 0
  return counts
}

export async function getBlogTagsWithCounts(): Promise<
  Array<{ name: string; slug: string; count: number }>
> {
  const supabase = createClient()
  const { data: posts } = await supabase
    .from('posts')
    .select('id')
    .eq('status', 'published')
    .is('deleted_at', null)

  const postIds = (posts ?? []).map((p) => p.id as string)
  if (!postIds.length) return []

  const { data: links } = await supabase
    .from('post_tags')
    .select('tag_id, tags(name, slug)')
    .in('post_id', postIds)

  const tally = new Map<string, { name: string; slug: string; count: number }>()
  for (const row of links ?? []) {
    const tag = row.tags as { name: string; slug: string } | { name: string; slug: string }[] | null
    const t = Array.isArray(tag) ? tag[0] : tag
    if (!t?.slug) continue
    const prev = tally.get(t.slug)
    if (prev) prev.count += 1
    else tally.set(t.slug, { name: t.name, slug: t.slug, count: 1 })
  }

  return [...tally.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export async function getBlogPosts(opts: {
  page: number
  q?: string
  category?: string
  tag?: string
}): Promise<{ posts: BlogListPost[]; total: number; hasCategory: boolean }> {
  const supabase = createClient()
  const hasCategory = await postsSupportCategory()
  const page = Math.max(1, opts.page)
  const from = (page - 1) * POSTS_PER_PAGE

  const selectFields = hasCategory
    ? 'id, title, slug, excerpt, featured_image, type, category, published_at, views, content, profiles(name)'
    : 'id, title, slug, excerpt, featured_image, type, published_at, views, content, profiles(name)'

  let postIdsForTag: string[] | null = null
  if (opts.tag) {
    const { data: tagRow } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', opts.tag)
      .maybeSingle()
    if (!tagRow?.id) return { posts: [], total: 0, hasCategory }

    const { data: tagged } = await supabase
      .from('post_tags')
      .select('post_id')
      .eq('tag_id', tagRow.id)
    postIdsForTag = (tagged ?? []).map((r) => r.post_id as string)
    if (!postIdsForTag.length) return { posts: [], total: 0, hasCategory }
  }

  let dbQuery = supabase
    .from('posts')
    .select(selectFields, { count: 'exact' })
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })

  if (opts.q) {
    dbQuery = dbQuery.or(`title.ilike.%${opts.q}%,excerpt.ilike.%${opts.q}%`)
  }

  if (opts.category) {
    if (hasCategory) {
      dbQuery = dbQuery.eq('category', opts.category)
    } else if (opts.category === 'news') {
      dbQuery = dbQuery.eq('type', 'news')
    } else {
      dbQuery = dbQuery.eq('type', 'blog')
    }
  }

  if (postIdsForTag) {
    dbQuery = dbQuery.in('id', postIdsForTag)
  }

  const { data, count, error } = await dbQuery.range(from, from + POSTS_PER_PAGE - 1)
  if (error) {
    console.error('[getBlogPosts]', error.message)
    return { posts: [], total: 0, hasCategory }
  }

  return {
    posts: (data ?? []) as BlogListPost[],
    total: count ?? 0,
    hasCategory,
  }
}

export async function getPopularBlogPosts(limit = 5) {
  const supabase = createClient()
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, published_at, views, featured_image')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('views', { ascending: false })
    .limit(limit)

  return data ?? []
}
