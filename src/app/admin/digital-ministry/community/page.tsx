import { DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { CommunityClient } from '@/components/admin/digital-ministry/community-client'
import { listDmComments } from '@/lib/digital-ministry/community'

export default async function CommunityPage() {
  const comments = await listDmComments('all')

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Community"
        description="Unified inbox with prayer / question categories and AI draft replies (approve before send)."
      />
      <CommunityClient
        comments={comments.map((c) => ({
          id: c.id,
          platform: c.platform,
          author_name: c.author_name,
          body: c.body,
          category: c.category,
          sentiment: c.sentiment,
          status: c.status,
          ai_draft_reply: c.ai_draft_reply,
          created_at: c.created_at,
        }))}
      />
    </div>
  )
}
