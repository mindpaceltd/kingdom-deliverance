import { createClient } from '@/lib/supabase/server'
import { PostsManager } from '@/components/admin/posts/posts-manager'
import { autoPublishScheduled } from '@/lib/actions/post-utils'
import type { Post } from '@/lib/types'

interface Props {
  searchParams: { filter?: string }
}

export default async function AdminPostsPage({ searchParams }: Props) {
  // Auto-publish any scheduled posts that are due
  await autoPublishScheduled()

  const supabase = createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(name, avatar_url)')
    .order('updated_at', { ascending: false })

  const filter = searchParams.filter ?? 'all'

  return (
    <PostsManager
      initialPosts={(posts as Post[]) ?? []}
      initialFilter={filter}
    />
  )
}
