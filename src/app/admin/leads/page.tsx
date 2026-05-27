import { listLeads } from '@/lib/actions/leads'
import { LeadsManager } from '@/components/admin/leads/leads-manager'

export default async function AdminLeadsPage() {
  const result = await listLeads()

  if ('error' in result) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground m-6">
        {result.error}
      </div>
    )
  }

  return <LeadsManager leads={result} />
}
