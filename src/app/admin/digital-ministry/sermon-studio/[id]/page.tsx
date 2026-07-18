import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSermonStudioDetail } from '@/lib/digital-ministry/sermon-studio'
import { DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { SermonStudioClient } from '@/components/admin/digital-ministry/sermon-studio-client'
import { Button } from '@/components/ui/button'

export default async function SermonStudioDetailPage({ params }: { params: { id: string } }) {
  const detail = await getSermonStudioDetail(params.id)
  if (!detail) notFound()

  return (
    <div className="space-y-6">
      <DmPageHeader
        title={detail.sermon.title}
        description={`${detail.sermon.preacher}${detail.sermon.date ? ` · ${detail.sermon.date}` : ''}`}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/digital-ministry/sermon-studio">All sermons</Link>
          </Button>
        }
      />
      <SermonStudioClient
        sermonId={detail.sermon.id}
        sermonTitle={detail.sermon.title}
        initialPack={detail.pack}
        segments={detail.segments.map((s) => ({
          id: s.id,
          kind: s.kind,
          label: s.label,
          transcript_excerpt: s.transcript_excerpt,
          start_seconds: s.start_seconds != null ? Number(s.start_seconds) : null,
          end_seconds: s.end_seconds != null ? Number(s.end_seconds) : null,
        }))}
      />
    </div>
  )
}
