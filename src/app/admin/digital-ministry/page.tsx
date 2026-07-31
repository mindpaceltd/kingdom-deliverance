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

const MODULES = [
  {
    href: '/admin/digital-ministry/studio',
    title: 'Content Studio',
    body: 'Draft, preview per platform, schedule, and publish.',
  },
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
    href: '/admin/digital-ministry/calendar',
    title: 'Calendar',
    body: 'See the publishing rhythm and spot empty weeks.',
  },
  {
    href: '/admin/digital-ministry/campaigns',
    title: 'Campaigns',
    body: 'Plan conferences, series, and outreach pushes end to end.',
  },
  {
    href: '/admin/digital-ministry/community',
    title: 'Community',
    body: 'Reply to comments and route prayer requests pastorally.',
  },
  {
    href: '/admin/digital-ministry/growth-coach',
    title: 'Growth Coach',
    body: 'Daily briefing, growth score, and prioritised tasks.',
  },
  {
    href: '/admin/digital-ministry/seo',
    title: 'SEO',
    body: 'Audit pages and fix what keeps you out of search results.',
  },
  {
    href: '/admin/digital-ministry/reports',
    title: 'Reports',
    body: 'Daily to yearly snapshots you can export and share.',
  },
]

export default async function DigitalMinistryDashboardPage() {
  const kpis = await getDigitalMinistryKpis()
  const [insights, summary] = await Promise.all([
    getDigitalMinistryInsights(kpis),
    getOrBuildAiSummary(kpis),
  ])

  // Everything a leader should act on today, with the count that makes it urgent.
  const queue = [
    {
      label: 'Unread prayer requests',
      count: kpis.unreadPrayer ?? 0,
      href: '/admin/inbox',
      note: 'Pray and respond first',
    },
    {
      label: 'Unread messages',
      count: kpis.unreadContact ?? 0,
      href: '/admin/inbox',
      note: 'People waiting on a reply',
    },
    {
      label: 'Open comments',
      count: kpis.openComments ?? 0,
      href: '/admin/digital-ministry/community',
      note: 'Conversations without a response',
    },
    {
      label: 'Connected accounts',
      count: kpis.connectedAccounts ?? 0,
      href: '/admin/digital-ministry/accounts',
      note: (kpis.connectedAccounts ?? 0) === 0 ? 'Connect one to publish' : 'Publishing enabled',
      inverse: true,
    },
  ]

  const conversions =
    (kpis.prayerRequests ?? 0) +
    (kpis.contactMessages ?? 0) +
    (kpis.donations ?? 0) +
    (kpis.testimonies ?? 0)

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

      {/* Needs attention */}
      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Needs attention today</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {queue.map((item) => {
            const urgent = item.inverse ? item.count === 0 : item.count > 0
            return (
              <Link key={item.label} href={item.href} className="group">
                <DmCard
                  className={cn(
                    'h-full p-4 transition-colors group-hover:bg-muted/30',
                    urgent && 'border-amber-500/40'
                  )}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <p
                    className={cn(
                      'mt-2 text-2xl font-semibold tabular-nums',
                      urgent && 'text-amber-700 dark:text-amber-400'
                    )}
                  >
                    {fmt(item.count)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
                </DmCard>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Reach & audience */}
      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Reach &amp; audience</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DmKpiCard
            label="Website visitors"
            value={fmt(kpis.websiteVisitors)}
            hint={
              kpis.websiteVisitors == null
                ? 'Save a snapshot in DM Analytics after GA sync'
                : 'From latest DM analytics snapshot'
            }
          />
          <DmKpiCard
            label="Returning visitors"
            value={fmt(kpis.returningVisitors)}
            hint={
              kpis.returningVisitors == null
                ? 'Appears when GA metrics are snapshotted'
                : 'From latest DM analytics snapshot'
            }
          />
          <DmKpiCard label="Sermon views" value={fmt(kpis.sermonViews)} hint="Published sermons" />
          <DmKpiCard
            label="Connected accounts"
            value={fmt(kpis.connectedAccounts)}
            hint="Platforms available for publishing"
          />
        </div>
      </div>

      {/* Content library */}
      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Content library</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <DmKpiCard label="Published posts" value={fmt(kpis.publishedPosts)} hint="Across platforms" />
          <DmKpiCard label="Published sermons" value={fmt(kpis.publishedSermons)} hint="Live on the site" />
          <DmKpiCard label="Events" value={fmt(kpis.eventCount)} hint="Upcoming and past" />
          <DmKpiCard label="Testimonies" value={fmt(kpis.testimonies)} hint="Your strongest content" />
          <DmKpiCard label="Media assets" value={fmt(kpis.mediaAssets)} hint="Images and video" />
        </div>
      </div>

      {/* Response & fruit */}
      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Response &amp; fruit</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DmKpiCard
            label="Prayer requests"
            value={fmt(kpis.prayerRequests)}
            hint={`${fmt(kpis.unreadPrayer)} unread`}
          />
          <DmKpiCard
            label="Contact messages"
            value={fmt(kpis.contactMessages)}
            hint={`${fmt(kpis.unreadContact)} unread`}
          />
          <DmKpiCard
            label="Donations & paid orders"
            value={fmt(kpis.donations)}
            hint="Confirmed donations + paid shop orders"
          />
          <DmKpiCard
            label="Total conversions"
            value={fmt(conversions)}
            hint="Prayer + contact + giving + testimonies"
          />
        </div>
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

      {/* Modules */}
      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">All modules</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <DmCard className="h-full p-5 transition-colors group-hover:border-primary/30 group-hover:bg-muted/30">
                <p className="font-semibold tracking-tight">{item.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
              </DmCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
