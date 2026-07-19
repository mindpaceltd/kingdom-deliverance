import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { SeoClient } from '@/components/admin/digital-ministry/seo-client'
import { listSeoAudits } from '@/lib/digital-ministry/ops'

function shortHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default async function SeoPage() {
  const audits = await listSeoAudits(30)

  const latest = audits[0]
  const scored = audits.filter((a) => typeof a.score === 'number') as Array<{ score: number }>
  const avg = scored.length
    ? Math.round(scored.reduce((sum, a) => sum + a.score, 0) / scored.length)
    : null
  const highIssues = audits.reduce((count, a) => {
    if (!Array.isArray(a.findings)) return count
    return (
      count +
      (a.findings as Array<{ severity?: string }>).filter((f) => f.severity === 'high').length
    )
  }, 0)
  const uniqueUrls = new Set(audits.map((a) => a.target_url)).size

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="SEO Center"
        description="Audit public pages for title, meta description, H1, canonical, and Open Graph — results saved for the media team."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/seo-tools">SEO Tools</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry">Dashboard</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard
          label="Latest score"
          value={latest?.score ?? '—'}
          hint={latest ? shortHost(latest.target_url) : 'Run an audit'}
          accent={
            latest?.score != null
              ? latest.score >= 80
                ? 'text-emerald-700'
                : latest.score >= 60
                  ? 'text-amber-700'
                  : 'text-destructive'
              : undefined
          }
        />
        <DmKpiCard
          label="Average score"
          value={avg ?? '—'}
          hint={audits.length ? `${audits.length} recent audits` : 'No history yet'}
        />
        <DmKpiCard label="Pages audited" value={uniqueUrls} hint="Unique URLs in history" />
        <DmKpiCard label="High severity" value={highIssues} hint="Across recent findings" />
      </div>

      <SeoClient
        audits={audits.map((a) => ({
          id: a.id,
          target_url: a.target_url,
          score: a.score,
          findings: a.findings,
          recommendations: a.recommendations,
          created_at: a.created_at,
        }))}
      />
    </div>
  )
}
