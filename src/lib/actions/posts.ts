'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRoles, ROLES } from '@/lib/authz'
import type { PostData } from '@/lib/types'

// ---------------------------------------------------------------------------
// Revalidate all post-related paths after any mutation
// ---------------------------------------------------------------------------

function revalidatePostPaths() {
  revalidatePath('/blog')
  revalidatePath('/blog/[slug]')
  revalidatePath('/')
}

// ---------------------------------------------------------------------------
// createPost
// Inserts a new post. Sets `published_at` if status is `published`.
// Requires `editor` or `admin` role.
// ---------------------------------------------------------------------------

export async function createPost(
  data: PostData
): Promise<{ success: true; id: string } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: data.title,
      slug: data.slug,
      content: data.content ?? null,
      excerpt: data.excerpt ?? null,
      featured_image: data.featured_image ?? null,
      type: data.type,
      status: data.status,
      author_id: result.id,
      published_at: data.status === 'published' ? new Date().toISOString() : null,
      meta_title: data.meta_title ?? null,
      meta_description: data.meta_description ?? null,
      focus_keyword: data.focus_keyword ?? null,
      seo_score: data.seo_score ?? 0,
      scheduled_at: data.status === 'scheduled' ? (data.scheduled_at ?? null) : null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createPost]', error.message)
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidatePostPaths()
  return { success: true, id: post.id }
}

// ---------------------------------------------------------------------------
// updatePost
// Updates an existing post. Sets `published_at` on first publish (i.e. when
// the post had no prior `published_at`).
// Requires `editor` or `admin` role.
// ---------------------------------------------------------------------------

export async function updatePost(
  id: string,
  data: PostData
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  // Fetch the existing post to check whether it has already been published
  const { data: existing, error: fetchError } = await supabase
    .from('posts')
    .select('published_at')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    console.error('[updatePost] fetch error', fetchError?.message)
    return { error: fetchError?.message ?? 'Post not found' }
  }

  // Only set published_at on the first publish transition
  const published_at =
    data.status === 'published' && !existing.published_at
      ? new Date().toISOString()
      : existing.published_at

  const { error } = await supabase
    .from('posts')
    .update({
      title: data.title,
      slug: data.slug,
      content: data.content ?? null,
      excerpt: data.excerpt ?? null,
      featured_image: data.featured_image ?? null,
      type: data.type,
      status: data.status,
      published_at,
      meta_title: data.meta_title ?? null,
      meta_description: data.meta_description ?? null,
      focus_keyword: data.focus_keyword ?? null,
      seo_score: data.seo_score ?? 0,
      scheduled_at: data.status === 'scheduled' ? (data.scheduled_at ?? null) : null,
    })
    .eq('id', id)

  if (error) {
    console.error('[updatePost]', error.message)
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidatePostPaths()
  return { success: true }
}

// ---------------------------------------------------------------------------
// deletePost
// Soft-archives a post by setting `status = 'archived'`.
// Kept for backward compatibility with existing code.
// Requires `editor` or `admin` role.
// ---------------------------------------------------------------------------

export async function deletePost(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { error } = await supabase
    .from('posts')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) {
    console.error('[deletePost]', error.message)
    return { error: error.message }
  }

  revalidatePostPaths()
  return { success: true }
}

// ---------------------------------------------------------------------------
// duplicatePost
// Copies all fields of the source post, prefixes title with "Copy of ",
// sets status = 'draft', clears published_at / scheduled_at / deleted_at,
// and generates a unique slug by appending -copy (or -copy-2, -copy-3, etc.)
// Requires `editor` or `admin` role.
// ---------------------------------------------------------------------------

export async function duplicatePost(
  id: string
): Promise<{ success: true; id: string } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  // Fetch the source post
  const { data: source, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !source) {
    return { error: fetchError?.message ?? 'Post not found' }
  }

  // Generate a unique slug
  const baseSlug = source.slug
  let candidateSlug = `${baseSlug}-copy`
  let attempt = 1

  while (attempt <= 99) {
    const { data: existing } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', candidateSlug)
      .maybeSingle()

    if (!existing) break

    attempt++
    candidateSlug = `${baseSlug}-copy-${attempt}`
  }

  if (attempt > 99) {
    return { error: 'Could not generate unique slug' }
  }

  const { data: newPost, error: insertError } = await supabase
    .from('posts')
    .insert({
      title: `Copy of ${source.title}`,
      slug: candidateSlug,
      content: source.content,
      excerpt: source.excerpt,
      featured_image: source.featured_image,
      type: source.type,
      status: 'draft',
      author_id: result.id,
      published_at: null,
      scheduled_at: null,
      deleted_at: null,
      meta_title: source.meta_title,
      meta_description: source.meta_description,
      focus_keyword: source.focus_keyword,
      seo_score: source.seo_score ?? 0,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[duplicatePost]', insertError.message)
    if (insertError.code === '23505') return { error: 'Slug already exists' }
    return { error: insertError.message }
  }

  revalidatePostPaths()
  return { success: true, id: newPost.id }
}

// ---------------------------------------------------------------------------
// trashPost
// Soft-deletes a post by setting status = 'trash' and deleted_at = NOW().
// Requires `editor` or `admin` role.
// ---------------------------------------------------------------------------

export async function trashPost(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { error } = await supabase
    .from('posts')
    .update({ status: 'trash', deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[trashPost]', error.message)
    return { error: error.message }
  }

  revalidatePostPaths()
  return { success: true }
}

// ---------------------------------------------------------------------------
// restorePost
// Restores a trashed post by setting status = 'draft' and deleted_at = NULL.
// Requires `editor` or `admin` role.
// ---------------------------------------------------------------------------

export async function restorePost(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { error } = await supabase
    .from('posts')
    .update({ status: 'draft', deleted_at: null })
    .eq('id', id)

  if (error) {
    console.error('[restorePost]', error.message)
    return { error: error.message }
  }

  revalidatePostPaths()
  return { success: true }
}

// ---------------------------------------------------------------------------
// permanentDeletePost
// Hard-deletes a post record from the database.
// Requires `admin` role.
// ---------------------------------------------------------------------------

export async function permanentDeletePost(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.ADMIN)
  if ('error' in result) return result

  const supabase = createClient()

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[permanentDeletePost]', error.message)
    return { error: error.message }
  }

  revalidatePostPaths()
  return { success: true }
}

// ---------------------------------------------------------------------------
// incrementPostViews
// Increments the views counter on the post identified by slug and inserts
// a record into page_views. No authentication required (called from public page).
// ---------------------------------------------------------------------------

export async function incrementPostViews(
  slug: string,
  path?: string
): Promise<void> {
  const supabase = createClient()

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

  // Atomically increment views counter via RPC
  await supabase.rpc('increment_post_views', { p_post_id: post.id })

  // Insert page_views record
  await supabase
    .from('page_views')
    .insert({
      post_id: post.id,
      path: path ?? null,
    })
    .then(({ error }) => {
      if (error) {
        console.error('[incrementPostViews] page_views insert error', error)
      }
    })
}
