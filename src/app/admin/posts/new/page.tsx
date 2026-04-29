import { createClient } from '@/lib/supabase/server'
import { PostEditorClient } from '@/components/admin/posts/post-editor-client'

export default async function NewPostPage() {
  const supabase = createClient()

  // Get the current user's profile to display author name
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let authorName = 'Unknown'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
    if (profile?.name) authorName = profile.name
  }

  return <PostEditorClient authorName={authorName} />
}
