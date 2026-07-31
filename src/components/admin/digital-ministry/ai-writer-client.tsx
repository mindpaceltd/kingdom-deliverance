'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DmCard, DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { generateDmDraftFromBrief } from '@/lib/digital-ministry/posts'
import { DM_AI_TONES, DM_STUDIO_PLATFORMS, type DmAiTone } from '@/lib/digital-ministry/types'
import { Loader2, Sparkles } from 'lucide-react'

const AGENTS = [
  { id: 'copywriter', name: 'Copywriter', blurb: 'Creates platform-ready posts from a brief or sermon notes.' },
  { id: 'seo', name: 'SEO Expert', blurb: 'Titles, meta, keywords, and internal link suggestions.' },
  { id: 'engagement', name: 'Engagement Expert', blurb: 'Hooks, CTAs, polls, and reply starters.' },
  { id: 'story', name: 'Storytelling Expert', blurb: 'Testimony and narrative arcs for Reels and blogs.' },
  { id: 'youth', name: 'Youth Specialist', blurb: 'Formats that resonate with Gen Z without watering down truth.' },
  { id: 'evangelism', name: 'Evangelism Expert', blurb: 'Outreach campaigns and invitation copy.' },
  { id: 'bible', name: 'Bible Scholar', blurb: 'Scripture references and devotion framing.' },
  { id: 'translator', name: 'Translator', blurb: 'English, Luganda, Swahili, French adaptations.' },
]

const AGENT_TONE: Record<string, DmAiTone> = {
  copywriter: 'professional',
  seo: 'professional',
  engagement: 'youth',
  story: 'testimony',
  youth: 'youth',
  evangelism: 'evangelism',
  bible: 'devotional',
  translator: 'evangelism',
}

const BRIEF_PRESETS = [
  {
    label: 'Sunday invite',
    text: 'Invite people to Sunday 10am service at KDC Uganda — theme: Walking in the Spirit. Include Romans 8:14 and a warm first-time-visitor welcome.',
  },
  {
    label: 'Deliverance testimony',
    text: 'Share a testimony of deliverance from fear after prayer at KDC Uganda. Keep names anonymous, end with an invitation to the next prayer night.',
  },
  {
    label: 'Midweek devotion',
    text: 'Short midweek devotion on trusting God in waiting seasons. One scripture, one practical step, one reflective question.',
  },
  {
    label: 'Event promo',
    text: 'Promote our upcoming three-day deliverance conference. Include dates, venue, what attendees will receive, and how to register.',
  },
]

const AGENT_LABELS: Record<string, string> = {
  studio_rewrite: 'Studio rewrite',
  sermon_studio_pack: 'Sermon pack',
  growth_coach: 'Growth Coach',
  community_reply: 'Community reply',
  seo_audit: 'SEO audit',
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export interface AiWriterStats {
  runs: { id: string; agent: string; model: string | null; createdAt: string }[]
  totalRuns: number
  runsThisWeek: number
  draftCount: number
  model: string | null
}

export function AiWriterClient({ stats }: { stats?: AiWriterStats }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [agent, setAgent] = useState('copywriter')
  const [brief, setBrief] = useState('')
  const [tone, setTone] = useState<DmAiTone>('evangelism')
  const [platforms, setPlatforms] = useState<string[]>(['facebook', 'instagram'])
  const [error, setError] = useState<string | null>(null)

  const runs = stats?.runs ?? []
  const activeAgent = AGENTS.find((a) => a.id === agent)

  function togglePlatform(id: string) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function generate() {
    setError(null)
    if (!brief.trim()) {
      setError('Add a short brief or sermon notes first.')
      return
    }
    if (!platforms.length) {
      setError('Choose at least one platform to write for.')
      return
    }
    startTransition(async () => {
      const result = await generateDmDraftFromBrief({
        brief: brief.trim(),
        agent,
        tone: tone || AGENT_TONE[agent] || 'evangelism',
        platforms,
      })
      if ('error' in result) setError(result.error)
      else router.push(`/admin/digital-ministry/studio/${result.id}`)
    })
  }

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="AI Writer"
        description="Specialist agents grounded in KDC content — drafts open in Content Studio."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry">Dashboard</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry/studio">Open Studio</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard
          label="Agents available"
          value={AGENTS.length}
          hint="Each tuned to a different voice"
        />
        <DmKpiCard
          label="Recent AI runs"
          value={stats?.totalRuns ?? 0}
          hint={stats?.runsThisWeek ? `${stats.runsThisWeek} in the last 7 days` : 'Across all modules'}
        />
        <DmKpiCard
          label="Drafts waiting"
          value={stats?.draftCount ?? 0}
          hint="Unpublished posts in Studio"
        />
        <DmKpiCard
          label="Model"
          value={stats?.model ? stats.model.replace('models/', '') : 'Gemini'}
          hint={stats?.model ? 'Last model used' : 'Set GEMINI_API_KEY to enable'}
        />
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Choose an agent
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {AGENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className="text-left"
              onClick={() => {
                setAgent(a.id)
                setTone(AGENT_TONE[a.id] || 'evangelism')
              }}
            >
              <DmCard
                className={`h-full p-4 transition-colors ${
                  agent === a.id
                    ? 'border-foreground/40 ring-1 ring-foreground/20'
                    : 'hover:bg-muted/30'
                }`}
              >
                <p className="text-sm font-semibold tracking-tight">{a.name}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{a.blurb}</p>
              </DmCard>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DmCard className="space-y-5 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" />
              <p className="text-sm font-semibold tracking-tight">
                Brief for the {activeAgent?.name ?? 'agent'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {BRIEF_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setBrief(preset.text)}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Brief / notes
              </label>
              <Textarea
                className="mt-1.5 min-h-[160px]"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="e.g. Invite people to Sunday 10am service — theme: Walking in the Spirit. Include Romans 8:14."
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {brief.trim().length} characters — the more context you give, the less editing you do.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Write for
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DM_STUDIO_PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      platforms.includes(p.id)
                        ? 'border-foreground/40 bg-foreground/10 text-foreground'
                        : 'border-border/60 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3 border-t border-border/60 pt-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tone
                </label>
                <select
                  className="mt-1.5 block rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as DmAiTone)}
                >
                  {DM_AI_TONES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={generate} disabled={pending}>
                {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                {pending ? 'Writing…' : 'Generate draft'}
              </Button>
            </div>

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </DmCard>

          <DmCard className="p-5">
            <p className="text-sm font-semibold tracking-tight">Recent AI activity</p>
            {runs.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                No AI runs logged yet. Your first generation will appear here.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border/60">
                {runs.map((run) => (
                  <li key={run.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {AGENT_LABELS[run.agent] ?? run.agent.replace(/_/g, ' ')}
                      </p>
                      {run.model ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {run.model.replace('models/', '')}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {relativeTime(run.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DmCard>
        </div>

        <div className="space-y-6">
          <DmCard className="p-5">
            <p className="text-sm font-semibold tracking-tight">How to get a usable draft</p>
            <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">1. Pick the agent</span> that matches
                the job, not the topic — a testimony needs the Storytelling agent even if the topic is
                healing.
              </li>
              <li>
                <span className="font-semibold text-foreground">2. Give real details.</span> Dates,
                venue, scripture, and the action you want people to take.
              </li>
              <li>
                <span className="font-semibold text-foreground">3. Select platforms</span> so length
                and formatting are tuned per channel.
              </li>
              <li>
                <span className="font-semibold text-foreground">4. Edit in Studio.</span> The draft
                opens there with per-platform previews before anything publishes.
              </li>
            </ol>
          </DmCard>

          <DmCard className="p-5">
            <p className="text-sm font-semibold tracking-tight">Before you publish</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>Check every scripture reference against the text — AI can misquote.</li>
              <li>Never publish a testimony without the person&apos;s permission.</li>
              <li>Keep the pastoral voice; rewrite anything that sounds like marketing.</li>
              <li>
                Drafts save to Studio as <code>draft</code> — nothing goes live until you schedule or
                publish it.
              </li>
            </ul>
          </DmCard>
        </div>
      </div>
    </div>
  )
}
