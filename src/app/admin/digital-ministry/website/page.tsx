import Link from 'next/link'
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  HeartHandshake,
  Inbox,
  LineChart,
  Megaphone,
  MessagesSquare,
  Newspaper,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import { DmCard, DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { Button } from '@/components/ui/button'
import { getDigitalMinistryKpis } from '@/lib/digital-ministry/dashboard'
import { cn } from '@/lib/utils'

const QUICK_LINKS = [
  {
    href: '/admin/analytics',
    label: 'Google Analytics',
    hint: 'Sessions, users, Search Console',
    icon: LineChart,
  },
  {
    href: '/admin/digital-ministry/seo',
    label: 'SEO Center',
    hint: 'Title, meta, H1 audits',
    icon: Search,
  },
  {
    href: '/admin/digital-ministry/community',
    label: 'Community inbox',
    hint: 'Prayer & contact follow-up',
    icon: MessagesSquare,
  },
  {
    href: '/admin/sermons',
    label: 'Sermons',
    hint: 'Publish & track views',
    icon: BookOpen,
  },
  {
    href: '/admin/posts',
    label: 'Blog posts',
    hint: 'Articles & updates',
    icon: Newspaper,
  },
  {
    href: '/admin/events',
    label: 'Events',
    hint: 'Services & gatherings',
    icon: CalendarDays,
  },
  {
    href: '/admin/inbox',
    label: 'Contact inbox',
    hint: 'Website messages',
    icon: Inbox,
  },
  {
    href: '/admin/testimonies',
    label: 'Testimonies',
    hint: 'Approve public stories',
    icon: HeartHandshake,
  },
] as const

function HealthRow({
  label,
  value,
  ok,
  href,
  action,
}: {
  label: string
  value: string
  ok: boolean
  href: string
  action: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'size-2 shrink-0 rounded-full',
              ok ? 'bg-emerald-600' : 'bg-amber-500'
            )}
            aria-hidden
          />
          <p className="text-sm font-medium">{label}</p>
        </div>
        <p className="mt-0.5 pl-4 text-xs text-muted-foreground">{value}</p>
      </div>
      <Button asChild size="sm" variant="ghost" className="shrink-0">
        <Link href={href}>
          {action}
          <ArrowUpRight className="ml-1 size-3.5 opacity-60" />
        </Link>
      </Button>
    </div>
  )
}

export default async function WebsiteAnalyticsPage() {
  const kpis = await getDigitalMinistryKpis()

  const inboxPressure = kpis.unreadPrayer + kpis.unreadContact + kpis.openComments
  const contentLive = kpis.publishedSermons + kpis.publishedPosts + kpis.eventCount
  const avgViews =
    kpis.publishedSermons > 0
      ? Math.round(kpis.sermonViews / kpis.publishedSermons)
      : 0

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Website Analytics"
        description="Conversion and engagement signals from the KDC site — prayer, contact, sermons, and content — with links into deeper Analytics tools."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/analytics">Google Analytics</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry">Dashboard</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard
          label="Website visitors"
          value={kpis.websiteVisitors != null ? kpis.websiteVisitors.toLocaleString() : '—'}
          hint={
            kpis.websiteVisitors != null
              ? kpis.returningVisitors != null
                ? `${kpis.returningVisitors.toLocaleString()} returning`
                : 'From latest analytics snapshot'
              : 'Connect GA under Analytics'
          }
        />
        <DmKpiCard
          label="Sermon views"
          value={kpis.sermonViews.toLocaleString()}
          hint={
            kpis.publishedSermons
              ? `~${avgViews.toLocaleString()} avg · ${kpis.publishedSermons} published`
              : 'No published sermons yet'
          }
        />
        <DmKpiCard
          label="Inbox pressure"
          value={inboxPressure}
          hint={`${kpis.unreadPrayer} prayer · ${kpis.unreadContact} contact · ${kpis.openComments} community`}
          accent={inboxPressure > 0 ? 'text-amber-700' : 'text-emerald-700'}
        />
        <DmKpiCard
          label="Live content"
          value={contentLive}
          hint={`${kpis.publishedSermons} sermons · ${kpis.publishedPosts} posts · ${kpis.eventCount} events`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Site conversions</h2>
            <p className="text-xs text-muted-foreground">
              Outcomes visitors take on kdcuganda.org — not vanity traffic alone.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <DmKpiCard
              label="Prayer requests"
              value={kpis.prayerRequests}
              hint={`${kpis.unreadPrayer} unread`}
              accent={kpis.unreadPrayer > 0 ? 'text-amber-700' : undefined}
            />
            <DmKpiCard
              label="Contact messages"
              value={kpis.contactMessages}
              hint={`${kpis.unreadContact} unread`}
              accent={kpis.unreadContact > 0 ? 'text-amber-700' : undefined}
            />
            <DmKpiCard label="Confirmed gifts" value={kpis.donations} hint="Donations + paid orders" />
            <DmKpiCard label="Testimonies" value={kpis.testimonies} hint="Approved on public site" />
            <DmKpiCard label="Events listed" value={kpis.eventCount} hint="Upcoming & past in CMS" />
            <DmKpiCard label="Media library" value={kpis.mediaAssets} hint="Assets available to publish" />
          </div>

          <DmCard className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">Site health queue</p>
            </div>
            <div className="space-y-2">
              <HealthRow
                label="Unread prayer requests"
                value={
                  kpis.unreadPrayer === 0
                    ? 'Caught up'
                    : `${kpis.unreadPrayer} waiting for pastoral follow-up`
                }
                ok={kpis.unreadPrayer === 0}
                href="/admin/digital-ministry/community"
                action="Review"
              />
              <HealthRow
                label="Unread contact messages"
                value={
                  kpis.unreadContact === 0
                    ? 'Inbox clear'
                    : `${kpis.unreadContact} need a reply`
                }
                ok={kpis.unreadContact === 0}
                href="/admin/inbox"
                action="Open"
              />
              <HealthRow
                label="Community threads"
                value={
                  kpis.openComments === 0
                    ? 'No open community items'
                    : `${kpis.openComments} marked new`
                }
                ok={kpis.openComments === 0}
                href="/admin/digital-ministry/community"
                action="Inbox"
              />
              <HealthRow
                label="Visitor analytics"
                value={
                  kpis.websiteVisitors != null
                    ? 'Google Analytics snapshot available'
                    : 'Not connected — sessions won’t appear here'
                }
                ok={kpis.websiteVisitors != null}
                href="/admin/analytics"
                action="Connect"
              />
            </div>
          </DmCard>

          <div>
            <h2 className="text-sm font-semibold tracking-tight">Content & tools</h2>
            <p className="text-xs text-muted-foreground">Jump to the surfaces that move these numbers.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="group block">
                  <DmCard className="flex h-full items-start gap-3 p-4 transition-colors group-hover:border-foreground/20 group-hover:bg-muted/30">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold">{item.label}</p>
                        <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
                    </div>
                  </DmCard>
                </Link>
              )
            })}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <DmCard className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">How to read this</p>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Visitors come from GA when connected; conversions come from your CMS tables.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Inbox pressure is the best weekly pulse — unanswered prayer or contact stalls trust.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Sermon views show whether teaching content is being found and watched.
              </li>
            </ul>
          </DmCard>

          <DmCard className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Megaphone className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">Weekly rhythm</p>
            </div>
            <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
              <li>Clear unread prayer and contact before Sunday.</li>
              <li>Publish or refresh one sermon / blog piece.</li>
              <li>Re-audit key pages in SEO Center after edits.</li>
              <li>Check Growth Coach for the site score trend.</li>
            </ol>
            <Button asChild size="sm" variant="secondary" className="w-full">
              <Link href="/admin/digital-ministry/growth-coach">Open Growth Coach</Link>
            </Button>
          </DmCard>

          <DmCard className="border-dashed p-5 text-xs leading-relaxed text-muted-foreground">
            Funnel events (Give, Prayer, Newsletter) fire on the public site. Detailed sessions and Search
            Console coverage live under{' '}
            <Link href="/admin/analytics" className="font-medium text-foreground underline underline-offset-2">
              Admin → Analytics
            </Link>
            .
          </DmCard>
        </aside>
      </div>
    </div>
  )
}
