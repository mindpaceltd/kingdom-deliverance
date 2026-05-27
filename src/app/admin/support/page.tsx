import { listSupportConversations } from '@/lib/actions/support'
import { SupportInbox } from '@/components/admin/support/support-inbox'
import type { SupportConversation } from '@/lib/support/types'

export default async function AdminSupportPage() {
  const result = await listSupportConversations()

  if ('error' in result) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        {result.error}
      </div>
    )
  }

  return <SupportInbox initialConversations={result as SupportConversation[]} />
}
