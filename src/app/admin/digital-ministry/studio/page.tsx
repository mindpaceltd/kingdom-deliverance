import Link from 'next/link'
import { createDmPost, listDmPosts } from '@/lib/digital-ministry/posts'
import { DmCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { redirect } from 'next/navigation'

async function createDraftAction() {
  'use server'
  const result = await createDmPost({
    title: 'Untitled draft',
    body: '',
    platforms: ['facebook', 'instagram'],
    status: 'draft',
  })
  if ('error' in result && result.error) {
    throw new Error(result.error)
  }
  if (!('id' in result) || !result.id) throw new Error('Failed to create draft')
  redirect(`/admin/digital-ministry/studio/${result.id}`)
}

export default async function StudioPage({
  searchParams,
}: {
  searchParams?: { status?: string }
}) {
  const statusFilter =
    searchParams?.status === 'draft' ||
    searchParams?.status === 'scheduled' ||
    searchParams?.status === 'published' ||
    searchParams?.status === 'all'
      ? searchParams.status
      : 'all'

  const posts = await listDmPosts({
    status: statusFilter === 'all' ? 'all' : statusFilter,
    limit: 80,
  })

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Drafts' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'published', label: 'Published' },
  ] as const

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Content Studio"
        description="Create once. Target many platforms. Schedule to the calendar or publish with manual fallback where APIs require it."
        actions={
          <form action={createDraftAction}>
            <Button type="submit" size="sm">
              New draft
            </Button>
          </form>
        }
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={statusFilter === f.id ? 'default' : 'outline'}
            asChild
          >
            <Link href={f.id === 'all' ? '/admin/digital-ministry/studio' : `?status=${f.id}`}>
              {f.label}
            </Link>
          </Button>
        ))}
        <Button size="sm" variant="ghost" asChild>
          <Link href="/admin/digital-ministry/calendar">Calendar</Link>
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/admin/digital-ministry/ai-writer">AI Writer</Link>
        </Button>
      </div>

      {!posts.length ? (
        <DmCard className="p-8 text-center text-sm text-muted-foreground">
          No posts yet. Create a draft or generate one from AI Writer.
        </DmCard>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <Link key={p.id} href={`/admin/digital-ministry/studio/${p.id}`} className="block">
              <DmCard className="p-4 transition-colors hover:bg-muted/30 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold tracking-tight">
                      {p.title || 'Untitled draft'}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {p.body || 'No body yet'}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {(p.platforms ?? []).join(' · ') || 'No platforms'}
                      {' · '}
                      Updated {new Date(p.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'w-fit shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      p.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700'
                        : p.status === 'scheduled'
                          ? 'bg-sky-50 text-sky-800'
                          : p.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {p.status}
                  </span>
                </div>
              </DmCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
