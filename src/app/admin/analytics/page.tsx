import { Suspense } from 'react'
import { Metadata } from 'next'
import { Loader2 } from 'lucide-react'
import { requireAdmin } from '@/lib/authz'
import { AnalyticsDashboard } from '@/components/admin/analytics/analytics-dashboard'

export const metadata: Metadata = {
  title: 'Analytics | Dashboard',
  description: 'Website traffic and performance analysis.',
}

function AnalyticsLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[40vh] space-y-4">
      <Loader2 className="size-10 animate-spin text-accent" />
      <p className="text-sm font-medium text-muted-foreground">Loading analytics…</p>
    </div>
  )
}

export default async function AnalyticsPage() {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
        <h1 className="text-xl font-bold text-destructive">Not authorised</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only administrators can access analytics.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Google Analytics, Search Console, and site performance in one place.
        </p>
      </div>
      <Suspense fallback={<AnalyticsLoading />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  )
}
