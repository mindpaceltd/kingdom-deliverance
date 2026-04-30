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

  const { data: post, error } = await supabase
    .from('posts')
    .select('*, profiles(name, avatar_url)')
    .eq('id', params.id)
    .single()

  if (error || !post) {
    redirect('/admin/posts')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let authorName = post.profiles?.name ?? 'Unknown'
  if (user && !authorName) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
    if (profile?.name) authorName = profile.name
  }

  const [allTags, postTags] = await Promise.all([
    getAllTags(),
    getPostTags(params.id),
  ])

  return (
    <PostEditorClient
      post={post as Post}
      authorName={authorName}
      allTags={allTags}
      initialTags={postTags}
    />
  )
}
