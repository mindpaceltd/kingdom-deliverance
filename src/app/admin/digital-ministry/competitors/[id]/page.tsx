import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { CompetitorDetailClient } from '@/components/admin/digital-ministry/competitor-detail-client'
import { getCompetitorDetailBundle } from '@/lib/digital-ministry/competitors'

export default async function CompetitorDetailPage({ params }: { params: { id: string } }) {
  const bundle = await getCompetitorDetailBundle(params.id)
  if ('error' in bundle) notFound()

  const { competitor, content, sources, latestRun, topics, gapMatrix } = bundle

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Competitor Intelligence"
        description="Content themes, capture status, and AI analysis from public sources only."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/digital-ministry/competitors">Watchlist</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard label="Content" value={latestRun?.content_count ?? 0} hint="Last capture" />
        <DmKpiCard label="Videos" value={latestRun?.video_count ?? 0} hint="YouTube + video type" />
        <DmKpiCard label="Sources" value={sources.length} hint="Configured + discovered" />
        <DmKpiCard
          label="Topics"
          value={topics.length}
          hint={topics[0]?.topic ? `Top: ${topics[0].topic}` : 'Run capture'}
        />
      </div>

      <CompetitorDetailClient
        competitor={competitor}
        content={content}
        sources={sources}
        latestRun={
          latestRun
            ? {
                content_count: latestRun.content_count,
                video_count: latestRun.video_count,
                website_posts: latestRun.website_posts,
                activity_score: latestRun.activity_score,
                ai_analysis: (latestRun.ai_analysis ?? {}) as Record<string, unknown>,
                data_limitations: (latestRun.data_limitations ?? []) as string[],
                steps: (latestRun.steps ?? []) as Array<{ label: string; status: string; message: string }>,
              }
            : null
        }
        topics={topics}
        gapMatrix={gapMatrix}
      />
    </div>
  )
}
