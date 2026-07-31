'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { archiveCampaign, upsertCampaign } from '@/lib/digital-ministry/ops'
import { Loader2, Plus, Megaphone } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
}

const TEMPLATES = [
  {
    label: 'Conference / crusade',
    name: 'Deliverance Conference',
    description:
      'Three-day conference push: teaser week, daily countdown posts, testimony reel, and a final-call invitation. Goal: registrations.',
    days: 21,
  },
  {
    label: 'Sermon series',
    name: 'Sermon Series Launch',
    description:
      'Weekly series promotion: key quote graphic, 60-second clip, and a discussion question for each message. Goal: sermon views.',
    days: 28,
  },
  {
    label: 'Outreach week',
    name: 'Community Outreach Week',
    description:
      'Daily outreach coverage with volunteer spotlights and a serve-with-us call to action. Goal: volunteer signups.',
    days: 7,
  },
  {
    label: 'Book / resource launch',
    name: 'Book Launch',
    description:
      'Launch a new title: cover reveal, three excerpt posts, author note, and a limited-time shop offer. Goal: shop orders.',
    days: 14,
  },
]

const STATUS_FILTERS = ['all', 'active', 'planned', 'completed'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

function statusTone(status: string) {
  switch (status) {
    case 'active':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    case 'completed':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
    case 'planned':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
    default:
      return 'border-border/60 bg-muted/40 text-muted-foreground'
  }
}

function formatDate(value: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Days remaining, or null when the campaign has no end date. */
function daysLeft(endDate: string | null) {
  if (!endDate) return null
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

function isoDaysFromNow(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function CampaignsClient({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: campaigns.length }
    for (const c of campaigns) {
      map[c.status] = (map[c.status] ?? 0) + 1
    }
    return map
  }, [campaigns])

  const visible = useMemo(
    () => (filter === 'all' ? campaigns : campaigns.filter((c) => c.status === filter)),
    [campaigns, filter]
  )

  function applyTemplate(template: (typeof TEMPLATES)[number]) {
    setShowForm(true)
    setName(template.name)
    setDescription(template.description)
    setStartDate(isoDaysFromNow(0))
    setEndDate(isoDaysFromNow(template.days))
  }

  function create() {
    startTransition(async () => {
      setError(null)
      const r = await upsertCampaign({
        name,
        description,
        status: 'active',
        startDate: startDate || null,
        endDate: endDate || null,
      })
      if (r.error) {
        setError(r.error)
        return
      }
      setName('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setShowForm(false)
      router.refresh()
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <DmCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold tracking-tight">Start from a template</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Prefills the name, goal, and a sensible run length — edit anything before saving.
              </p>
            </div>
            <Button size="sm" variant={showForm ? 'outline' : 'default'} onClick={() => setShowForm((s) => !s)}>
              <Plus className="mr-1.5 size-3.5" />
              {showForm ? 'Close form' : 'New campaign'}
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => applyTemplate(t)}
                className="rounded-xl border border-border/60 p-3 text-left transition-colors hover:bg-muted/40"
              >
                <p className="text-sm font-medium">{t.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.days}-day run</p>
              </button>
            ))}
          </div>

          {showForm ? (
            <div className="mt-5 space-y-3 border-t border-border/60 pt-5">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Campaign name
                </label>
                <Input
                  className="mt-1.5"
                  placeholder="e.g. Deliverance Conference 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Goal / description
                </label>
                <Textarea
                  className="mt-1.5"
                  placeholder="What outcome are you praying and working for? e.g. 300 registrations."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Starts
                  </label>
                  <Input
                    className="mt-1.5"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Ends
                  </label>
                  <Input
                    className="mt-1.5"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" disabled={pending || !name.trim()} onClick={create}>
                  {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                  Create campaign
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
              {error ? (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          ) : null}
        </DmCard>

        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  filter === key
                    ? 'border-foreground/40 bg-foreground/10 text-foreground'
                    : 'border-border/60 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                {key} {counts[key] ? `(${counts[key]})` : ''}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <DmCard className="p-8 text-center">
              <Megaphone className="mx-auto size-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">
                {campaigns.length === 0 ? 'No campaigns yet' : `No ${filter} campaigns`}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                {campaigns.length === 0
                  ? 'Pick a template above to plan your first multi-platform push.'
                  : 'Try a different filter, or create a new campaign.'}
              </p>
            </DmCard>
          ) : (
            <div className="space-y-2">
              {visible.map((c) => {
                const remaining = daysLeft(c.end_date)
                return (
                  <DmCard key={c.id} className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold tracking-tight">{c.name}</p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(
                              c.status
                            )}`}
                          >
                            {c.status}
                          </span>
                          {remaining !== null && remaining >= 0 && c.status === 'active' ? (
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {remaining === 0 ? 'ends today' : `${remaining} days left`}
                            </span>
                          ) : null}
                          {remaining !== null && remaining < 0 ? (
                            <span className="text-[11px] font-medium text-muted-foreground">ended</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(c.start_date) ?? 'No start date'}
                          {c.end_date ? ` → ${formatDate(c.end_date)}` : ''}
                        </p>
                        {c.description ? (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {c.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href="/admin/digital-ministry/studio">Add content</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await archiveCampaign(c.id)
                              router.refresh()
                            })
                          }
                        >
                          Archive
                        </Button>
                      </div>
                    </div>
                  </DmCard>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <DmCard className="p-5">
          <p className="text-sm font-semibold tracking-tight">How a campaign runs</p>
          <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">1. Name the outcome.</span> &ldquo;300
              conference registrations&rdquo; beats &ldquo;promote the conference&rdquo;.
            </li>
            <li>
              <span className="font-semibold text-foreground">2. Draft in Studio</span> and schedule
              posts across the campaign window instead of publishing all at once.
            </li>
            <li>
              <span className="font-semibold text-foreground">3. Keep a rhythm</span> — teaser,
              teaching, testimony, then a clear final call.
            </li>
            <li>
              <span className="font-semibold text-foreground">4. Review in Reports</span> at the end
              and archive the campaign so the list stays honest.
            </li>
          </ol>
        </DmCard>

        <DmCard className="p-5">
          <p className="text-sm font-semibold tracking-tight">Suggested cadence</p>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Conference:</span> daily for the last
              week, 3× weekly before that.
            </li>
            <li>
              <span className="font-medium text-foreground">Sermon series:</span> one clip and one
              quote per message.
            </li>
            <li>
              <span className="font-medium text-foreground">Book launch:</span> alternate excerpt and
              testimony, with one offer reminder.
            </li>
            <li>Leave room for spontaneous testimonies — they consistently out-perform planned posts.</li>
          </ul>
        </DmCard>

        <DmCard className="p-5">
          <p className="text-sm font-semibold tracking-tight">Related tools</p>
          <div className="mt-3 grid gap-2">
            <Button asChild size="sm" variant="outline" className="justify-start">
              <Link href="/admin/digital-ministry/calendar">Content calendar</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="justify-start">
              <Link href="/admin/digital-ministry/studio">Content Studio</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="justify-start">
              <Link href="/admin/digital-ministry/reports">Reports</Link>
            </Button>
          </div>
        </DmCard>
      </div>
    </div>
  )
}
