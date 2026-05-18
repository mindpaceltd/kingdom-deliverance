'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

const BOT_PATTERNS = /bot|crawler|spider|googlebot|bingbot/i

export async function incrementPostViews(
  slug: string,
  path?: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  // Get headers if not provided
  const headersList = headers()
  const actualIp = ip ?? headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headersList.get('x-real-ip') ?? 'unknown'
  const actualUserAgent = userAgent ?? headersList.get('user-agent') ?? ''

  // Skip bot traffic
  if (actualUserAgent && BOT_PATTERNS.test(actualUserAgent)) {
    return
  }

  const supabase = createClient()

  // Prevent admin / editor views from inflating stats
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle()
      if (profile?.role === 'admin' || profile?.role === 'editor') {
        return
      }
    }
  } catch (err) {
    console.error('[incrementPostViews] Auth check error:', err)
  }

  // Find the post by slug (published only)
  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!post) {
    // Slug not found or not published — return silently
    return
  }

  // IP throttling: skip if a page_views record exists for the same ip + post_id within the last 10 seconds
  if (actualIp && actualIp !== 'unknown') {
    const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString()
    const { data: recentView } = await supabase
      .from('page_views')
      .select('id')
      .eq('post_id', post.id)
      .eq('ip', actualIp)
      .gte('created_at', tenSecondsAgo)
      .maybeSingle()

    if (recentView) {
      // Already recorded a view from this IP within the last 10 seconds
      return
    }
  }

  // Atomically increment views counter via RPC
  await supabase.rpc('increment_post_views', { p_post_id: post.id })

  // Insert page_views record (including ip for throttling)
  await supabase
    .from('page_views')
    .insert({
      post_id: post.id,
      path: path ?? null,
      ip: actualIp !== 'unknown' ? actualIp : null,
    })
    .then(({ error }) => {
      if (error) {
        console.error('[incrementPostViews] page_views insert error', error)
      }
    })
}