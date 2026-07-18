'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DmCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { generateDmDraftFromBrief } from '@/lib/digital-ministry/posts'
import { DM_AI_TONES, type DmAiTone } from '@/lib/digital-ministry/types'
import { Loader2 } from 'lucide-react'

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

export function AiWriterClient() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [agent, setAgent] = useState('copywriter')
  const [brief, setBrief] = useState('')
  const [tone, setTone] = useState<DmAiTone>('evangelism')
  const [error, setError] = useState<string | null>(null)

  function generate() {
    setError(null)
    if (!brief.trim()) {
      setError('Add a short brief or sermon notes first.')
      return
    }
    startTransition(async () => {
      const result = await generateDmDraftFromBrief({
        brief: brief.trim(),
        agent,
        tone: tone || AGENT_TONE[agent] || 'evangelism',
        platforms: ['facebook', 'instagram'],
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
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/digital-ministry/studio">Open Studio</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {AGENTS.map((a) => (
          <button key={a.id} type="button" onClick={() => {
            setAgent(a.id)
            setTone(AGENT_TONE[a.id] || 'evangelism')
          }}>
            <DmCard
              className={`h-full p-4 text-left transition-colors ${
                agent === a.id ? 'border-foreground/40 ring-1 ring-foreground/20' : 'hover:bg-muted/30'
              }`}
            >
              <p className="text-sm font-semibold tracking-tight">{a.name}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{a.blurb}</p>
            </DmCard>
          </button>
        ))}
      </div>

      <DmCard className="space-y-4 p-5">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Brief / notes
          </label>
          <Textarea
            className="mt-1.5 min-h-[140px]"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. Invite people to Sunday 10am service — theme: Walking in the Spirit. Include Romans 8:14."
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
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
            Generate draft
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <p className="text-xs text-muted-foreground">
          Uses Gemini and saves a draft to <code>dm_posts</code>, logging the run in{' '}
          <code>dm_ai_generations</code>.
        </p>
      </DmCard>
    </div>
  )
}
