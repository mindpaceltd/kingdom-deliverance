'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRoles, ROLES } from '@/lib/authz'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostData {
  title: string
  slug: string
  content?: string
  excerpt?: string
  featured_image?: string
  type: 'blog' | 'news'
  status: 'draft' | 'published'
}

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
