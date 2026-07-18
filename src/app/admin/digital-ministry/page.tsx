import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DmCard,
  DmKpiCard,
  DmPageHeader,
} from '@/components/admin/digital-ministry/dm-ui'
import {
  getDigitalMinistryInsights,
  getDigitalMinistryKpis,
  getOrBuildAiSummary,
} from '@/lib/digital-ministry/dashboard'
import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toLocaleString()
}

export default async function DigitalMinistryDashboardPage() {
  const kpis = await getDigitalMinistryKpis()
  const [insights, summary] = await Promise.all([
    getDigitalMinistryInsights(kpis),
    getOrBuildAiSummary(kpis),
  ])

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Dashboard"
        description="One command center for reach, content, community, and growth — powered by KDC’s real data."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/digital-ministry/accounts">Connect accounts</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/digital-ministry/studio">
                Open Studio <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          </>
        }
      />

      {/* AI Summary */}
      <DmCard className="relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">AI Summary</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{summary.greeting}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{summary.body}</p>
            <div className="rounded-xl border border-border/70 bg-background/60 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recommendation
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{summary.recommendation}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Expected impact: <span className="font-semibold text-foreground">{summary.expectedImpact}</span>
                {' · '}
                Confidence {summary.confidence}%
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-border bg-background/70 px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Growth score
            </p>
            <p className="mt-1 text-4xl font-semibold tabular-nums">
              {kpis.growthScore != null ? `${kpis.growthScore}` : '—'}
              <span className="text-lg text-muted-foreground">%</span>
            </p>
            <Button asChild variant="link" className="mt-1 h-auto p-0 text-xs">
              <Link href="/admin/digital-ministry/growth-coach">Open Growth Coach</Link>
            </Button>
          </div>
        </div>
      </DmCard>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        <DmKpiCard label="Sermon views" value={fmt(kpis.sermonViews)} hint="Published sermons" />
        <DmKpiCard label="Published posts" value={fmt(kpis.publishedPosts)} />
        <DmKpiCard label="Published sermons" value={fmt(kpis.publishedSermons)} />
        <DmKpiCard label="Prayer requests" value={fmt(kpis.prayerRequests)} hint={`${kpis.unreadPrayer} unread`} />
        <DmKpiCard label="Contact messages" value={fmt(kpis.contactMessages)} hint={`${kpis.unreadContact} unread`} />
        <DmKpiCard label="Events" value={fmt(kpis.eventCount)} />
        <DmKpiCard label="Testimonies" value={fmt(kpis.testimonies)} />
        <DmKpiCard label="Media assets" value={fmt(kpis.mediaAssets)} />
        <DmKpiCard label="Connected accounts" value={fmt(kpis.connectedAccounts)} />
        <DmKpiCard label="Open comments" value={fmt(kpis.openComments)} />
        <DmKpiCard label="Website visitors" value={fmt(kpis.websiteVisitors)} hint="Connect GA in Website Analytics" />
        <DmKpiCard label="Returning visitors" value={fmt(kpis.returningVisitors)} hint="Requires GA Data API" />
        <DmKpiCard label="Newsletter signups" value={fmt(kpis.newsletterSignups)} hint="Wire when list source is ready" />
        <DmKpiCard label="Donations" value={fmt(kpis.donations)} hint="Wire from payments / give flows" />
        <DmKpiCard label="Conversions" value="—" hint="Events, prayer, give CTAs" />
      </div>

      {/* Insight cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Insights</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {insights.map((card) => (
            <DmCard key={card.label} className="p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
              <p
                className={cn(
                  'mt-2 text-lg font-semibold',
                  card.tone === 'positive' && 'text-emerald-700 dark:text-emerald-400',
                  card.tone === 'warning' && 'text-amber-700 dark:text-amber-400'
                )}
              >
                {card.value}
              </p>
              {card.hint ? <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p> : null}
            </DmCard>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          {
            href: '/admin/digital-ministry/sermon-studio',
            title: 'Sermon Studio',
            body: 'Turn one sermon into weeks of posts, Shorts, and newsletter copy.',
          },
          {
            href: '/admin/digital-ministry/ai-writer',
            title: 'AI Writer',
            body: 'Specialist agents for captions, SEO, youth, evangelism, and translation.',
          },
          {
            href: '/admin/analytics',
            title: 'Google Analytics',
            body: 'Existing GA + Search Console connection powers Website Analytics.',
          },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <DmCard className="h-full p-5 transition-colors group-hover:border-primary/30 group-hover:bg-muted/30">
              <p className="font-semibold tracking-tight">{item.title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </DmCard>
          </Link>
        ))}
      </div>
    </div>
  )
}
