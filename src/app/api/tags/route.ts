import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'

// POST /api/tags — find or create a tag by name
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }

    const trimmed = String(name).trim()
    const slug = generateSlug(trimmed)
    if (!slug) {
      return NextResponse.json({ error: 'Tag name produces an invalid slug' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Try to find existing tag first
    const { data: existing } = await supabase
      .from('tags')
      .select('id, name, slug, created_at')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ tag: existing })
    }

    // Insert new tag
    const { data: created, error } = await supabase
      .from('tags')
      .insert({ name: trimmed, slug })
      .select('id, name, slug, created_at')
      .single()

    if (error) {
      // Race condition — fetch the winner
      if (error.code === '23505') {
        const { data: race } = await supabase
          .from('tags')
          .select('id, name, slug, created_at')
          .eq('slug', slug)
          .single()
        if (race) return NextResponse.json({ tag: race })
      }
      console.error('[POST /api/tags]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tag: created })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[POST /api/tags] unexpected:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/tags/sync — replace all tags for a post
export async function PUT(req: NextRequest) {
  try {
    const { postId, tagIds } = await req.json()
    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Delete existing
    const { error: deleteError } = await supabase
      .from('post_tags')
      .delete()
      .eq('post_id', postId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    if (!tagIds?.length) {
      return NextResponse.json({ success: true })
    }

    const rows = tagIds.map((tag_id: string) => ({ post_id: postId, tag_id }))
    const { error: insertError } = await supabase.from('post_tags').insert(rows)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
