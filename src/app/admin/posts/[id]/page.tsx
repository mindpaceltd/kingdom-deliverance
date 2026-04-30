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

  // Run post fetch and user auth in parallel
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
  let authorName: string = (post.profiles as { name?: string | null } | null)?.name ?? ''

  // Fetch tags in parallel — wrapped in try/catch so a tags error doesn't 500 the whole page
  const [allTags, postTags, currentProfile] = await Promise.all([
    getAllTags().catch(() => []),
    getPostTags(params.id).catch(() => []),
    !authorName && user
      ? Promise.resolve(supabase.from('profiles').select('name').eq('id', user.id).single())
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
