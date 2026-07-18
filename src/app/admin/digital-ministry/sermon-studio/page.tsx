import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { DmCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'

export default async function SermonStudioPage() {
  const supabase = createClient()
  const { data: sermons } = await supabase
    .from('sermons')
    .select('id, title, status, views, date, slug')
    .eq('status', 'published')
    .order('date', { ascending: false })
    .limit(8)

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Sermon Studio"
        description="Turn one message into weeks of posts, Shorts, Reels, newsletters, and small-group guides."
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

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <DmCard className="p-5 lg:col-span-1">
          <p className="text-sm font-semibold">Pipeline</p>
          <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li>1. Select sermon or paste YouTube URL</li>
            <li>2. Transcribe / summarize (Gemini or Whisper queue)</li>
            <li>3. Extract points, verses, prayer points, clips</li>
            <li>4. Generate multi-platform pack</li>
            <li>5. Push drafts to Content Calendar</li>
          </ol>
          <Button className="mt-4 w-full" disabled>
            Run pack (Phase 3)
          </Button>
        </DmCard>

        <DmCard className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Recent published sermons</p>
            <Link href="/admin/sermons/jobs" className="text-xs text-muted-foreground underline">
              AI jobs
            </Link>
          </div>
          <div className="mt-3 divide-y">
            {(sermons ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No published sermons yet.
              </p>
            ) : (
              (sermons ?? []).map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {(s.views ?? 0).toLocaleString()} views
                      {s.date ? ` · ${s.date}` : ''}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/sermons/${s.id}`}>Open</Link>
                  </Button>
                </div>
              ))
            )}
          </div>
        </DmCard>
      </div>

      <DmCard className="p-5">
        <p className="text-sm font-semibold">Auto-generated pack (per sermon)</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {[
            '20 Tweets',
            '10 Facebook posts',
            '5 LinkedIn articles',
            '30 Shorts ideas',
            '20 Reels',
            'TikTok scripts',
            'Blog + SEO article',
            'Newsletter',
            'Podcast summary',
            'Discussion questions',
            'Small group guide',
            'Youth + children versions',
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-xs font-medium"
            >
              {item}
            </div>
          ))}
        </div>
      </DmCard>
    </div>
  )
}
