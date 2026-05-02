import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidatePostPaths() {
  revalidatePath('/blog')
  revalidatePath('/blog/[slug]')
  revalidatePath('/admin/posts')
  revalidatePath('/')
}

export async function autoPublishScheduled(): Promise<void> {
  const supabase = createClient()

  const now = new Date().toISOString()

  const { data: scheduledPosts, error: fetchError } = await supabase
    .from('posts')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)

  if (fetchError) {
    console.error('[autoPublishScheduled] fetch error', fetchError.message)
    return
  }

  if (!scheduledPosts || scheduledPosts.length === 0) {
    return
  }

  const ids = scheduledPosts.map((p) => p.id)

  const { error: updateError } = await supabase
    .from('posts')
    .update({ status: 'published', published_at: now })
    .in('id', ids)

  if (updateError) {
    console.error('[autoPublishScheduled] update error', updateError.message)
    return
  }

  revalidatePostPaths()
}