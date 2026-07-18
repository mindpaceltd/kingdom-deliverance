'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  CopyIcon,
  RotateCcw,
  TrashIcon,
  SparklesIcon,
  LinkIcon,
  TypeIcon,
  FilterIcon,
  CalendarIcon,
  EyeIcon,
  VideoIcon,
  UserIcon,
  GlobeIcon,
  ExternalLinkIcon,
  XIcon,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  trashSermon,
  restoreSermon,
  duplicateSermon,
  duplicateSermons,
  deleteSermon,
} from '@/lib/actions/sermons'
import { analyzeSermonVideo } from '@/lib/actions/sermon-ai'
import { createClient } from '@/lib/supabase/client'
import { buildPublicContentUrl } from '@/lib/seo/public-content-urls'
import { getSeoScoreColor } from '@/lib/posts-helpers'
import type { Sermon } from '@/lib/types'

const PAGE_SIZE = 10

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateStr
  }
}

function uniqueValues(sermons: Sermon[], key: keyof Sermon): string[] {
  const seen = new Set<string>()
  for (const s of sermons) {
    const v = s[key]
    if (v && typeof v === 'string') seen.add(v)
  }
  return Array.from(seen).sort()
}

function SeoScoreBadge({ score }: { score: number }) {
  const color = getSeoScoreColor(score ?? 0)
  const colorClass = {
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    green: 'text-green-600 bg-green-50',
  }[color]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
        colorClass
      )}
    >
      {score ?? 0}
    </span>
  )
}

function OgReadiness({ sermon }: { sermon: Sermon }) {
  const hasTitle = Boolean(sermon.meta_title?.trim())
  const hasExcerpt = Boolean(
    sermon.meta_description?.trim() || sermon.description?.trim()
  )
  const hasImage = Boolean(sermon.thumbnail_url?.trim())

  const items = [
    { ok: hasTitle, label: 'Title', key: 'T' },
    { ok: hasExcerpt, label: 'Excerpt', key: 'E' },
    { ok: hasImage, label: 'Image', key: 'I' },
  ]

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1">
        {items.map((item) => (
          <span
            key={item.key}
            title={`OG ${item.label}: ${item.ok ? 'set' : 'missing'}`}
            className={cn(
              'text-[9px] font-black w-5 h-5 rounded flex items-center justify-center border',
              item.ok
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-muted text-muted-foreground border-border'
            )}
          >
            {item.key}
          </span>
        ))}
      </div>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
        OG / SEO
      </span>
    </div>
  )
}

interface SermonsManagerProps {
  initialSermons: Sermon[]
}

export function SermonsManager({ initialSermons }: SermonsManagerProps) {
  const router = useRouter()
  const [sermons, setSermons] = React.useState<Sermon[]>(initialSermons)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const [magicUrl, setMagicUrl] = React.useState('')
  const [magicTitle, setMagicTitle] = React.useState('')
  const [magicLoading, setMagicLoading] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('url')

  const [filterPreacher, setFilterPreacher] = React.useState('all')
  const [filterStatus, setFilterStatus] = React.useState('all')
  const [filterDateFrom, setFilterDateFrom] = React.useState('')
  const [filterDateTo, setFilterDateTo] = React.useState('')

  const preachers = React.useMemo(() => uniqueValues(sermons, 'preacher'), [sermons])

  const refreshSermons = React.useCallback(async () => {
    setIsRefreshing(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('sermons')
      .select('*, sermon_series(name)')
      .order('date', { ascending: false })
    if (data) setSermons(data as Sermon[])
    setIsRefreshing(false)
  }, [])

  const filteredSermons = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return sermons.filter((s) => {
      if (filterPreacher !== 'all' && s.preacher !== filterPreacher) return false
      if (filterStatus !== 'all' && s.status !== filterStatus) return false
      if (filterDateFrom && s.date < filterDateFrom) return false
      if (filterDateTo && s.date > filterDateTo) return false
      if (q) {
        const haystack = [s.title, s.preacher, s.series, s.slug]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [sermons, filterPreacher, filterStatus, filterDateFrom, filterDateTo, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredSermons.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pagedSermons = filteredSermons.slice(pageStart, pageStart + PAGE_SIZE)
  const pageIds = pagedSermons.map((s) => s.id)

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const somePageSelected =
    pageIds.some((id) => selectedIds.has(id)) && !allPageSelected

  const stats = React.useMemo(
    () => ({
      total: sermons.length,
      published: sermons.filter((s) => s.status === 'published').length,
      drafts: sermons.filter((s) => s.status === 'draft').length,
      views: sermons.reduce((acc, s) => acc + (s.views || 0), 0),
    }),
    [sermons]
  )

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDuplicate(sermon: Sermon) {
    setActionLoading(`dup-${sermon.id}`)
    const result = await duplicateSermon(sermon.id)
    setActionLoading(null)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Sermon duplicated as draft')
    await refreshSermons()
    router.push(`/admin/sermons/${result.id}`)
  }

  async function handleBulkDuplicate() {
    if (selectedIds.size === 0) return
    if (
      !window.confirm(
        `Duplicate ${selectedIds.size} sermon(s)? Copies will be saved as drafts.`
      )
    ) {
      return
    }
    setActionLoading('bulk-dup')
    const result = await duplicateSermons(Array.from(selectedIds))
    setActionLoading(null)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success(`Duplicated ${result.count} sermon(s)`)
    setSelectedIds(new Set())
    await refreshSermons()
    router.refresh()
  }

  async function submitUrlsToGoogle(urls: string[]) {
    if (urls.length === 0) {
      toast.error('No published sermons with a slug selected.')
      return
    }
    const { submitGoogleIndexing } = await import('@/lib/seo/submit-google-indexing-client')
    const result = await submitGoogleIndexing(urls)
    if (!result.ok) {
      toast.error(result.message, { description: result.hint })
      return
    }
    toast.success(result.message)
  }

  async function handleSingleIndex(sermon: Sermon) {
    if (sermon.status !== 'published' || !sermon.slug) {
      toast.error('Only published sermons can be indexed.')
      return
    }
    setActionLoading(`index-${sermon.id}`)
    try {
      await submitUrlsToGoogle([buildPublicContentUrl('sermon', sermon.slug)])
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBulkIndex() {
    const urls = sermons
      .filter(
        (s) =>
          selectedIds.has(s.id) && s.status === 'published' && s.slug
      )
      .map((s) => buildPublicContentUrl('sermon', s.slug!))

    setActionLoading('bulk-index')
    try {
      await submitUrlsToGoogle(urls)
    } finally {
      setActionLoading(null)
      setSelectedIds(new Set())
    }
  }

  async function handleTrash(sermon: Sermon) {
    if (!window.confirm(`Move "${sermon.title}" to trash?`)) return
    setActionLoading(`trash-${sermon.id}`)
    const result = await trashSermon(sermon.id)
    setActionLoading(null)
    if ('error' in result) toast.error(result.error)
    else {
      toast.success('Moved to trash')
      await refreshSermons()
    }
  }

  async function handleRestore(sermon: Sermon) {
    setActionLoading(`restore-${sermon.id}`)
    const result = await restoreSermon(sermon.id)
    setActionLoading(null)
    if ('error' in result) toast.error(result.error)
    else {
      toast.success('Sermon restored')
      await refreshSermons()
    }
  }

  async function handlePermanentDelete(sermon: Sermon) {
    if (!window.confirm(`Permanently delete "${sermon.title}"? This cannot be undone.`))
      return
    setActionLoading(`del-${sermon.id}`)
    const result = await deleteSermon(sermon.id)
    setActionLoading(null)
    if ('error' in result) toast.error(result.error)
    else {
      toast.success('Sermon deleted')
      await refreshSermons()
    }
  }

  async function handleMagicAI() {
    const isUrlMode = activeTab === 'url'
    const input = isUrlMode ? magicUrl.trim() : magicTitle.trim()
    if (!input) return

    setMagicLoading(true)
    try {
      const result = await analyzeSermonVideo({
        videoUrl: isUrlMode ? input : undefined,
        title: !isUrlMode ? input : undefined,
      })
      if (result.success) {
        setMagicUrl('')
        setMagicTitle('')
        setIsDialogOpen(false)
        toast.success('AI draft created')
        await refreshSermons()
      } else {
        toast.error(result.error || 'AI analysis failed')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setMagicLoading(false)
    }
  }

  const bulkBusy = Boolean(
    actionLoading?.startsWith('bulk-') || actionLoading === 'bulk-dup'
  )

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sermons</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage messages, SEO, Open Graph previews, and Google indexing.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-violet-500/30 text-violet-700">
                <SparklesIcon className="size-4" />
                Sermon Magic AI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <SparklesIcon className="size-5 text-violet-600" />
                  Sermon Magic AI
                </DialogTitle>
                <DialogDescription>
                  Generate sermon notes, excerpt, and SEO fields automatically.
                </DialogDescription>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url" className="gap-2">
                    <LinkIcon className="size-4" />
                    From Video
                  </TabsTrigger>
                  <TabsTrigger value="title" className="gap-2">
                    <TypeIcon className="size-4" />
                    From Title
                  </TabsTrigger>
                </TabsList>
                <div className="mt-4">
                  <TabsContent value="url" className="m-0 space-y-2">
                    <Label htmlFor="video-url">YouTube URL</Label>
                    <Input
                      id="video-url"
                      value={magicUrl}
                      onChange={(e) => setMagicUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </TabsContent>
                  <TabsContent value="title" className="m-0 space-y-2">
                    <Label htmlFor="sermon-title-ai">Sermon title</Label>
                    <Input
                      id="sermon-title-ai"
                      value={magicTitle}
                      onChange={(e) => setMagicTitle(e.target.value)}
                      placeholder="Sermon title"
                    />
                  </TabsContent>
                </div>
              </Tabs>
              <DialogFooter>
                <Button
                  onClick={handleMagicAI}
                  disabled={
                    magicLoading ||
                    (activeTab === 'url' ? !magicUrl.trim() : !magicTitle.trim())
                  }
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  {magicLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Generating…
                    </>
                  ) : (
                    'Generate Draft'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={() => router.push('/admin/sermons/new')} className="gap-2">
            <PlusIcon className="size-4" />
            New Sermon
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'Total Sermons', value: stats.total, icon: VideoIcon },
          { label: 'Total Views', value: stats.views.toLocaleString(), icon: EyeIcon },
          { label: 'Published', value: stats.published, icon: EyeIcon },
          { label: 'Drafts', value: stats.drafts, icon: PencilIcon },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm"
          >
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">{stat.label}</p>
            <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b space-y-3">
          <Input
            placeholder="Search title, series or preacher..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={filterPreacher}
              onValueChange={(v) => {
                setFilterPreacher(v ?? 'all')
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <FilterIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Preacher" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Preachers</SelectItem>
                {preachers.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v ?? 'all')
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="trash">Trash</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-9 w-full pl-8 text-xs"
                aria-label="From date"
              />
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium uppercase text-muted-foreground">
                to
              </span>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-9 w-full pl-8 text-xs"
                aria-label="To date"
              />
            </div>
          </div>
        </div>

        {isRefreshing ? (
          <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Refreshing…
          </div>
        ) : filteredSermons.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No sermons match your filters.
          </div>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[40px_minmax(0,1fr)_110px_90px_80px_100px_200px] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b bg-muted/30">
              <div className="flex justify-center">
                <Checkbox
                  checked={allPageSelected}
                  indeterminate={somePageSelected}
                  onChange={toggleSelectAll}
                />
              </div>
              <div>Sermon Details</div>
              <div>Date</div>
              <div className="text-center">Views</div>
              <div className="text-center">SEO</div>
              <div className="text-center">Status</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="divide-y">
              {pagedSermons.map((sermon) => {
                const isTrash = sermon.status === 'trash'
                const isSelected = selectedIds.has(sermon.id)
                const busy = actionLoading?.includes(sermon.id)

                return (
                  <div
                    key={sermon.id}
                    className={cn(
                      'grid grid-cols-1 lg:grid-cols-[40px_minmax(0,1fr)_110px_90px_80px_100px_200px] gap-3 px-4 py-4 items-center transition-colors',
                      isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                    )}
                  >
                    <div className="hidden lg:flex justify-center">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectRow(sermon.id)}
                      />
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex shrink-0 lg:hidden">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleSelectRow(sermon.id)}
                        />
                      </div>
                      <div className="size-12 rounded-lg overflow-hidden bg-muted shrink-0 border">
                        {sermon.thumbnail_url ? (
                          <img
                            src={sermon.thumbnail_url}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-muted-foreground">
                            <VideoIcon className="size-5 opacity-40" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/sermons/${sermon.id}`)}
                          className="text-sm font-semibold text-left hover:text-primary w-full line-clamp-2 sm:truncate sm:line-clamp-none"
                        >
                          {sermon.title}
                        </button>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {sermon.sermon_series?.name || sermon.series || 'Individual'} ·{' '}
                          {sermon.preacher}
                        </p>
                        {sermon.meta_title && (
                          <p className="text-[10px] text-muted-foreground/80 line-clamp-1 mt-0.5 hidden sm:block">
                            OG: {sermon.meta_title}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 lg:hidden">
                          <StatusBadge status={sermon.status} />
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(sermon.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground lg:block hidden">
                      {formatDate(sermon.date)}
                    </div>

                    <div className="text-sm font-medium text-center lg:block hidden">
                      {(sermon.views ?? 0).toLocaleString()}
                    </div>

                    <div className="lg:flex hidden flex-col items-center gap-1">
                      <SeoScoreBadge score={sermon.seo_score ?? 0} />
                      <OgReadiness sermon={sermon} />
                    </div>

                    <div className="lg:flex hidden justify-center">
                      <StatusBadge status={sermon.status} />
                    </div>

                    <div className="flex items-center justify-end gap-1 flex-wrap col-span-full lg:col-span-1 pt-1 lg:pt-0 border-t lg:border-0 mt-1 lg:mt-0">
                      {isTrash ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Restore"
                            disabled={busy}
                            onClick={() => handleRestore(sermon)}
                          >
                            <RotateCcw className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete permanently"
                            disabled={busy}
                            className="text-destructive"
                            onClick={() => handlePermanentDelete(sermon)}
                          >
                            <TrashIcon className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Edit & SEO"
                            onClick={() => router.push(`/admin/sermons/${sermon.id}`)}
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          {sermon.status === 'published' && sermon.slug && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Submit to Google"
                                disabled={busy}
                                onClick={() => handleSingleIndex(sermon)}
                              >
                                <GlobeIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="View live"
                                asChild
                              >
                                <Link
                                  href={`/sermons/${sermon.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLinkIcon className="size-3.5" />
                                </Link>
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Duplicate"
                            disabled={busy}
                            onClick={() => handleDuplicate(sermon)}
                          >
                            {actionLoading === `dup-${sermon.id}` ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <CopyIcon className="size-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Move to trash"
                            disabled={busy}
                            className="text-destructive/80 hover:text-destructive"
                            onClick={() => handleTrash(sermon)}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t text-sm text-muted-foreground">
              <span className="text-center sm:text-left">
                Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredSermons.length)}{' '}
                of {filteredSermons.length}
              </span>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-medium px-2">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary text-primary-foreground shadow-xl"
          >
            <span className="text-sm font-bold border-r border-white/20 pr-3">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 hover:bg-white/10"
              disabled={bulkBusy}
              onClick={handleBulkDuplicate}
            >
              <CopyIcon className="size-3.5 mr-1.5" />
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 hover:bg-white/10"
              disabled={bulkBusy}
              onClick={handleBulkIndex}
            >
              <GlobeIcon className="size-3.5 mr-1.5" />
              Index on Google
            </Button>
            <button
              type="button"
              className="p-1 rounded-full hover:bg-white/10"
              onClick={() => setSelectedIds(new Set())}
            >
              <XIcon className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
