import { createClient } from '@/lib/supabase/server'
import { PostEditorClient } from '@/components/admin/posts/post-editor-client'
import { getAllTags } from '@/lib/actions/tags'

export default async function NewPostPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let authorName = 'Unknown'
  if (user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      if (profile?.name) authorName = profile.name
    } catch { /* non-fatal */ }
  }

  let allTags: import('@/lib/types').Tag[] = []
  try {
    allTags = await getAllTags()
  } catch { /* non-fatal — tags are optional */ }

  return <PostEditorClient authorName={authorName} allTags={allTags} />
}
