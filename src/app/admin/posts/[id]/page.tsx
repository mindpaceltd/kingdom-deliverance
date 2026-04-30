import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostEditorClient } from '@/components/admin/posts/post-editor-client'
import { getAllTags, getPostTags } from '@/lib/actions/tags'
import type { Post } from '@/lib/types'

interface Props {
  params: { id: string }
}

export default async function EditPostPage({ params }: Props) {
  const supabase = createClient()

  // Run all fetches in parallel
  const [postResult, userResult] = await Promise.all([
    supabase
      .from('posts')
      .select('*, profiles(name, avatar_url)')
      .eq('id', params.id)
      .single(),
    supabase.auth.getUser(),
  ])

  const { data: post, error } = postResult

  if (error || !post) {
    redirect('/admin/posts')
  }

  const user = userResult.data.user

  // Resolve author name — prefer the joined profile, fall back to current user's profile
  let authorName: string = (post.profiles as { name?: string | null } | null)?.name ?? ''

  // Fetch tags and (if needed) current user profile in parallel
  const [allTags, postTags, currentProfile] = await Promise.all([
    getAllTags(),
    getPostTags(params.id),
    !authorName && user
      ? supabase.from('profiles').select('name').eq('id', user.id).single()
      : Promise.resolve(null),
  ])

  if (!authorName && currentProfile && 'data' in currentProfile && currentProfile.data?.name) {
    authorName = currentProfile.data.name
  }
  if (!authorName) authorName = 'Unknown'

  return (
    <PostEditorClient
      post={post as Post}
      authorName={authorName}
      allTags={allTags}
      initialTags={postTags}
    />
  )
}
