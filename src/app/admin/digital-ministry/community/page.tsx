import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { CommunityClient } from '@/components/admin/digital-ministry/community-client'
import { listDmComments } from '@/lib/digital-ministry/community'

export default async function CommunityPage() {
  const comments = await listDmComments('all')

  const newCount = comments.filter((c) => c.status === 'new').length
  const prayerCount = comments.filter((c) => c.category === 'prayer').length
  const needsDraft = comments.filter(
    (c) => c.status === 'new' || c.status === 'drafted' || c.status === 'approved'
  ).length
  const repliedCount = comments.filter((c) => c.status === 'replied').length

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Community"
        description="Unified pastoral inbox — website contact, prayer requests, and manual notes. Draft with AI; always approve before sending."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/digital-ministry">Dashboard</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard label="Needs attention" value={newCount} hint="Status: new" />
        <DmKpiCard label="Prayer requests" value={prayerCount} hint="Category: prayer" />
        <DmKpiCard label="Open threads" value={needsDraft} hint="New, drafted, or approved" />
        <DmKpiCard label="Replied" value={repliedCount} hint="Closed successfully" />
      </div>

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
