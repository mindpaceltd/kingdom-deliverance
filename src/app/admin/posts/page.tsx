import { createClient } from '@/lib/supabase/server'
import { PostsManager } from '@/components/admin/posts/posts-manager'
import type { Post } from '@/lib/types'

export default async function AdminPostsPage() {
  const supabase = createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(name, avatar_url)')
    .order('updated_at', { ascending: false })

  return <PostsManager initialPosts={(posts as Post[]) ?? []} />
}
