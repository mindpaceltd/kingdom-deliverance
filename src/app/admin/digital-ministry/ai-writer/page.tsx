import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'

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

const OUTPUTS = [
  'Facebook Post', 'Tweet', 'LinkedIn Article', 'Blog', 'Newsletter',
  'Event Promotion', 'Prayer', 'Daily Devotion', 'Caption',
  'YouTube Title', 'Description', 'Thumbnail Text', 'Hashtags',
]

export default function AiWriterPage() {
  return (
    <div className="space-y-6">
      <DmPageHeader
        title="AI Writer"
        description="Specialist agents grounded in KDC content and analytics — never generic filler."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/digital-ministry/sermon-studio">Open Sermon Studio</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {AGENTS.map((a) => (
          <DmCard key={a.id} className="p-4">
            <p className="text-sm font-semibold tracking-tight">{a.name}</p>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{a.blurb}</p>
            <Button size="sm" className="mt-4 w-full" variant="secondary" disabled>
              Generate (Phase 2)
            </Button>
          </DmCard>
        ))}
      </div>

      <DmCard className="p-5">
        <p className="text-sm font-semibold">Supported outputs</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {OUTPUTS.map((o) => (
            <span
              key={o}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
            >
              {o}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Generation will call the existing Gemini stack (`src/lib/actions/ai.ts`) with dashboard
          KPIs and sermon/post context, logging each run to <code>dm_ai_generations</code>.
        </p>
      </DmCard>
    </div>
  )
}
