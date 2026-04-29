import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostEditorClient } from '@/components/admin/posts/post-editor-client'
import type { Post } from '@/lib/types'

interface Props {
  params: { id: string }
}

export default async function EditPostPage({ params }: Props) {
  const supabase = createClient()

  // Fetch the post by ID
  const { data: post, error } = await supabase
    .from('posts')
    .select('*, profiles(name, avatar_url)')
    .eq('id', params.id)
    .single()

  // Redirect to posts list if post not found or invalid ID
  if (error || !post) {
    redirect('/admin/posts')
  }

  // Get the current user's profile to display author name
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

  return <PostEditorClient post={post as Post} authorName={authorName} />
}
