import { createClient } from '@/lib/supabase/server'
import type { Post, Sermon, Event, Ministry, GalleryItem } from '@/lib/types'

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function getPosts(opts?: {
  type?: 'blog' | 'news'
  limit?: number
}): Promise<Post[]> {
  const supabase = createClient()
  let query = supabase
    .from('posts')
    .select('*, profiles(name, avatar_url)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (opts?.type) query = query.eq('type', opts.type)
  if (opts?.limit) query = query.limit(opts.limit)

  const { data, error } = await query
  if (error) {
    console.error('[getPosts]', error.message)
    return []
  }
  return data ?? []
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (error) {
    console.error('[getPostBySlug]', error.message)
    return null
  }
  return data
}

// ─── Sermons ──────────────────────────────────────────────────────────────────

export async function getSermons(opts?: {
  preacher?: string
  series?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}): Promise<{ data: Sermon[]; count: number }> {
  const supabase = createClient()
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 12
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('sermons')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('date', { ascending: false })

  if (opts?.preacher) query = query.eq('preacher', opts.preacher)
  if (opts?.series) query = query.eq('series', opts.series)
  if (opts?.from) query = query.gte('date', opts.from)
  if (opts?.to) query = query.lte('date', opts.to)

  const { data, count, error } = await query.range(offset, offset + pageSize - 1)
  if (error) {
    console.error('[getSermons]', error.message)
    return { data: [], count: 0 }
  }
  return { data: data ?? [], count: count ?? 0 }
}

export async function getSermonBySlug(slug: string): Promise<Sermon | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sermons')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (error) {
    console.error('[getSermonBySlug]', error.message)
    return null
  }
  return data
}

export async function getSermonFilters(): Promise<{
  preachers: string[]
  series: string[]
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sermons')
    .select('preacher, series')
    .eq('status', 'published')

  if (error) {
    console.error('[getSermonFilters]', error.message)
    return { preachers: [], series: [] }
  }

  const preachers = Array.from(new Set((data ?? []).map((r) => r.preacher).filter(Boolean))) as string[]
  const series = Array.from(new Set((data ?? []).map((r) => r.series).filter(Boolean))) as string[]

  return { preachers, series }
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(opts?: {
  featured?: boolean
  status?: string
}): Promise<Event[]> {
  const supabase = createClient()
  let query = supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })

  if (opts?.featured !== undefined) query = query.eq('is_featured', opts.featured)
  if (opts?.status) query = query.eq('status', opts.status)

  const { data, error } = await query
  if (error) {
    console.error('[getEvents]', error.message)
    return []
  }
  return data ?? []
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) {
    console.error('[getEventBySlug]', error.message)
    return null
  }
  return data
}

// ─── Ministries ───────────────────────────────────────────────────────────────

export async function getMinistries(activeOnly?: boolean): Promise<Ministry[]> {
  const supabase = createClient()
  let query = supabase
    .from('ministries')
    .select('*')
    .order('display_order', { ascending: true })

  if (activeOnly) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) {
    console.error('[getMinistries]', error.message)
    return []
  }
  return data ?? []
}

export async function getMinistryBySlug(slug: string): Promise<Ministry | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ministries')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) {
    console.error('[getMinistryBySlug]', error.message)
    return null
  }
  return data
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data, error } = await supabase.from('site_settings').select('key, value')
  if (error) {
    console.error('[getSiteSettings]', error.message)
    return {}
  }
  return Object.fromEntries(
    (data ?? []).filter((r) => r.value !== null).map((r) => [r.key, r.value as string])
  )
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export async function getGallery(album?: string): Promise<GalleryItem[]> {
  const supabase = createClient()
  let query = supabase
    .from('gallery')
    .select('*')
    .order('display_order', { ascending: true })

  if (album) query = query.eq('album', album)

  const { data, error } = await query
  if (error) {
    console.error('[getGallery]', error.message)
    return []
  }
  return data ?? []
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchContent(query: string): Promise<{
  posts: Post[]
  sermons: Sermon[]
  events: Event[]
}> {
  const empty = { posts: [], sermons: [], events: [] }
  if (!query || query.trim().length < 2) return empty

  const q = query.trim()
  const supabase = createClient()

  const [postsResult, sermonsResult, eventsResult] = await Promise.all([
    supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`),
    supabase
      .from('sermons')
      .select('*')
      .eq('status', 'published')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`),
    supabase
      .from('events')
      .select('*')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`),
  ])

  if (postsResult.error) console.error('[searchContent:posts]', postsResult.error.message)
  if (sermonsResult.error) console.error('[searchContent:sermons]', sermonsResult.error.message)
  if (eventsResult.error) console.error('[searchContent:events]', eventsResult.error.message)

  return {
    posts: (postsResult.data ?? []) as Post[],
    sermons: sermonsResult.data ?? [],
    events: eventsResult.data ?? [],
  }
}

export async function getFeaturedHomepageContent(): Promise<{
  sermon: Sermon | null
  event: Event | null
  post: Post | null
}> {
  const supabase = createClient()
  const [sermonRes, eventRes, postRes] = await Promise.all([
    supabase
      .from('sermons')
      .select('*')
      .eq('status', 'published')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('events')
      .select('*')
      .eq('is_featured', true)
      .in('status', ['upcoming', 'ongoing'])
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    sermon: sermonRes.data ?? null,
    event: eventRes.data ?? null,
    post: postRes.data ?? null,
  }
}
