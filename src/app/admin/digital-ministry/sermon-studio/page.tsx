import Link from 'next/link'
import { listStudioSermons } from '@/lib/digital-ministry/sermon-studio'
import { DmCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { Button } from '@/components/ui/button'

export default async function SermonStudioPage() {
  const sermons = await listStudioSermons(16)

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Sermon Studio"
        description="Turn one message into clips, Shorts, posts, newsletters, and small-group guides."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/sermons">Sermons CMS</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/sermons/new">Add sermon</Link>
            </Button>
          </>
        }
      />

      <DmCard className="p-5">
        <p className="text-sm font-semibold">Pipeline</p>
        <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
          <li>1. Pick a sermon with notes/content</li>
          <li>2. Generate pack (Gemini) → clip segments + formats</li>
          <li>3. Review clips and copy</li>
          <li>4. Push drafts to Content Studio</li>
          <li>5. Schedule from Studio → Calendar</li>
        </ol>
      </DmCard>

      <div className="space-y-2">
        {(sermons ?? []).length === 0 ? (
          <DmCard className="p-8 text-center text-sm text-muted-foreground">
            No sermons yet. Add one in Sermons CMS with description/content.
          </DmCard>
        ) : (
          sermons.map((s) => (
            <DmCard key={s.id} className="p-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold tracking-tight">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.preacher}
                    {s.date ? ` · ${s.date}` : ''}
                    {` · ${(s.views ?? 0).toLocaleString()} views`}
                    {` · ${s.status}`}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/admin/digital-ministry/sermon-studio/${s.id}`}>Open Studio</Link>
                </Button>
              </div>
            </DmCard>
          ))
        )}
      </div>
    </div>
  )
}
