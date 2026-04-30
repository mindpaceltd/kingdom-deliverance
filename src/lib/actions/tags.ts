'use server'

import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import { requireRole } from '@/lib/actions/auth-helpers'
import type { Tag } from '@/lib/types'

// ---------------------------------------------------------------------------
// getAllTags — public, no auth required
// ---------------------------------------------------------------------------

export async function getAllTags(): Promise<Tag[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('[getAllTags]', error.message)
    return []
  }
  return (data as Tag[]) ?? []
}

// ---------------------------------------------------------------------------
// getPostTags — fetch tags for a specific post
// ---------------------------------------------------------------------------

export async function getPostTags(postId: string): Promise<Tag[]> {
  const supabase = createClient()

  // Use explicit join via tag_id to avoid nested select issues
  const { data, error } = await supabase
    .from('post_tags')
    .select('tag_id')
    .eq('post_id', postId)

  if (error) {
    console.error('[getPostTags]', error.message)
    return []
  }

  if (!data || data.length === 0) return []

  const tagIds = data.map((row) => row.tag_id)

  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .in('id', tagIds)
    .order('name', { ascending: true })

  if (tagsError) {
    console.error('[getPostTags] tags fetch error', tagsError.message)
    return []
  }

  return (tags as Tag[]) ?? []
}

// ---------------------------------------------------------------------------
// upsertTag — find or create a tag by name, return its ID
// ---------------------------------------------------------------------------

export async function upsertTag(
  name: string
): Promise<{ id: string } | { error: string }> {
  const auth = await requireRole('author')
  if ('error' in auth) return auth

  const trimmed = name.trim()
  if (!trimmed) return { error: 'Tag name cannot be empty' }

  const slug = generateSlug(trimmed)
  if (!slug) return { error: 'Tag name produces an invalid slug' }

  const supabase = createClient()

  // Try to find existing tag first
  const { data: existing } = await supabase
    .from('tags')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) return { id: existing.id }

  // Insert new tag
  const { data: created, error } = await supabase
    .from('tags')
    .insert({ name: trimmed, slug })
    .select('id')
    .single()

  if (error) {
    // Race condition — another insert won; fetch the existing one
    if (error.code === '23505') {
      const { data: race } = await supabase
        .from('tags')
        .select('id')
        .eq('slug', slug)
        .single()
      if (race) return { id: race.id }
    }
    console.error('[upsertTag]', error.message)
    return { error: error.message }
  }

  return { id: created.id }
}

// ---------------------------------------------------------------------------
// syncPostTags — replace all tags for a post with the given tag IDs
// Called after createPost / updatePost
// ---------------------------------------------------------------------------

export async function syncPostTags(
  postId: string,
  tagIds: string[]
): Promise<{ success: true } | { error: string }> {
  const auth = await requireRole('author')
  if ('error' in auth) return auth

  const supabase = createClient()

  // Delete existing associations
  const { error: deleteError } = await supabase
    .from('post_tags')
    .delete()
    .eq('post_id', postId)

  if (deleteError) {
    console.error('[syncPostTags] delete error', deleteError.message)
    return { error: deleteError.message }
  }

  if (tagIds.length === 0) return { success: true }

  // Insert new associations
  const rows = tagIds.map((tag_id) => ({ post_id: postId, tag_id }))
  const { error: insertError } = await supabase.from('post_tags').insert(rows)

  if (insertError) {
    console.error('[syncPostTags] insert error', insertError.message)
    return { error: insertError.message }
  }

  return { success: true }
}
