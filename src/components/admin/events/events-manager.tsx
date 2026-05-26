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
  MapPin,
  Calendar,
  ExternalLink,
  GlobeIcon,
  XIcon,
  Loader2,
  FilterIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  trashEvent,
  restoreEvent,
  duplicateEvent,
  duplicateEvents,
  deleteEvent,
} from '@/lib/actions/events'
import { createClient } from '@/lib/supabase/client'
import { buildPublicContentUrl } from '@/lib/seo/public-content-urls'
import { getSeoScoreColor } from '@/lib/posts-helpers'
import type { Event } from '@/lib/types'

const PAGE_SIZE = 10

const INDEXABLE_STATUSES = new Set(['published', 'upcoming', 'ongoing'])

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

function isEventIndexable(event: Event): boolean {
  return INDEXABLE_STATUSES.has(event.status) && Boolean(event.slug?.trim())
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

function OgReadiness({ event }: { event: Event }) {
  const hasTitle = Boolean(event.meta_title?.trim())
  const hasExcerpt = Boolean(
    event.meta_description?.trim() || event.description?.trim()
  )
  const hasImage = Boolean(event.image_url?.trim())

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

interface EventsManagerProps {
  initialEvents: Event[]
}

export function EventsManager({ initialEvents }: EventsManagerProps) {
  const router = useRouter()
  const [events, setEvents] = React.useState<Event[]>(initialEvents)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState('all')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const refreshEvents = React.useCallback(async () => {
    setIsRefreshing(true)
    const supabase = createClient()
    const { data } = await supabase.from('events').select('*').order('date', { ascending: false })
    if (data) setEvents(data as Event[])
    setIsRefreshing(false)
  }, [])

  const filteredEvents = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return events.filter((e) => {
      if (filterStatus !== 'all' && e.status !== filterStatus) return false
      if (q) {
        const haystack = [e.title, e.location, e.slug]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [events, filterStatus, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pagedEvents = filteredEvents.slice(pageStart, pageStart + PAGE_SIZE)
  const pageIds = pagedEvents.map((e) => e.id)

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const somePageSelected =
    pageIds.some((id) => selectedIds.has(id)) && !allPageSelected

  const stats = React.useMemo(
    () => ({
      total: events.length,
      upcoming: events.filter((e) =>
        ['published', 'upcoming', 'ongoing'].includes(e.status)
      ).length,
      featured: events.filter((e) => e.is_featured).length,
      views: events.reduce((acc, e) => acc + (e.views || 0), 0),
    }),
    [events]
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

  async function submitUrlsToGoogle(urls: string[]) {
    if (urls.length === 0) {
      toast.error('No published/upcoming/ongoing events with a slug selected.')
      return
    }
    const res = await fetch('/api/google/search-console/index-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Indexing request failed')
      return
    }
    const ok =
      data.results?.filter((r: { success?: boolean }) => r.success).length ?? urls.length
    toast.success(`Submitted ${ok} URL(s) to Google for indexing`)
  }

  async function handleSingleIndex(event: Event) {
    if (!isEventIndexable(event)) {
      toast.error('Only published, upcoming, or ongoing events can be indexed.')
      return
    }
    setActionLoading(`index-${event.id}`)
    try {
      await submitUrlsToGoogle([buildPublicContentUrl('event', event.slug!)])
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBulkIndex() {
    const urls = events
      .filter((e) => selectedIds.has(e.id) && isEventIndexable(e))
      .map((e) => buildPublicContentUrl('event', e.slug!))

    setActionLoading('bulk-index')
    try {
      await submitUrlsToGoogle(urls)
    } finally {
      setActionLoading(null)
      setSelectedIds(new Set())
    }
  }

  async function handleDuplicate(event: Event) {
    setActionLoading(`dup-${event.id}`)
    const result = await duplicateEvent(event.id)
    setActionLoading(null)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Event duplicated as draft')
    await refreshEvents()
    router.push(`/admin/events/${result.id}`)
  }

  async function handleBulkDuplicate() {
    if (selectedIds.size === 0) return
    if (
      !window.confirm(
        `Duplicate ${selectedIds.size} event(s)? Copies will be saved as drafts.`
      )
    ) {
      return
    }
    setActionLoading('bulk-dup')
    const result = await duplicateEvents(Array.from(selectedIds))
    setActionLoading(null)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success(`Duplicated ${result.count} event(s)`)
    setSelectedIds(new Set())
    await refreshEvents()
    router.refresh()
  }

  async function handleTrash(event: Event) {
    if (!window.confirm(`Move "${event.title}" to trash?`)) return
    setActionLoading(`trash-${event.id}`)
    const result = await trashEvent(event.id)
    setActionLoading(null)
    if ('error' in result) toast.error(result.error)
    else {
      toast.success('Moved to trash')
      await refreshEvents()
    }
  }

  async function handleRestore(event: Event) {
    setActionLoading(`restore-${event.id}`)
    const result = await restoreEvent(event.id)
    setActionLoading(null)
    if ('error' in result) toast.error(result.error)
    else {
      toast.success('Event restored')
      await refreshEvents()
    }
  }

  async function handlePermanentDelete(event: Event) {
    if (!window.confirm(`Permanently delete "${event.title}"? This cannot be undone.`))
      return
    setActionLoading(`del-${event.id}`)
    const result = await deleteEvent(event.id)
    setActionLoading(null)
    if ('error' in result) toast.error(result.error)
    else {
      toast.success('Event deleted')
      await refreshEvents()
    }
  }

  const bulkBusy = Boolean(
    actionLoading?.startsWith('bulk-') || actionLoading === 'bulk-dup'
  )

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage programs, SEO, Open Graph previews, and Google indexing.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshEvents}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RotateCcw className={cn('size-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/admin/events/new')} className="gap-2">
            <PlusIcon className="size-4" />
            New Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: stats.total },
          { label: 'Live / Upcoming', value: stats.upcoming },
          { label: 'Featured', value: stats.featured },
          { label: 'Total Views', value: stats.views.toLocaleString() },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <Input
              placeholder="Search events by title, location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="max-w-md"
            />
            <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border">
              <FilterIcon className="size-3.5 text-muted-foreground ml-2" />
              <Select
                value={filterStatus}
                onValueChange={(v) => {
                  setFilterStatus(v ?? 'all')
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[160px] border-none bg-transparent shadow-none">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="trash">Trash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isRefreshing ? (
          <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Refreshing…
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No events match your filters.
          </div>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[40px_minmax(0,1fr)_150px_80px_90px_100px_200px] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b bg-muted/30">
              <div className="flex justify-center">
                <Checkbox
                  checked={allPageSelected}
                  indeterminate={somePageSelected}
                  onChange={toggleSelectAll}
                />
              </div>
              <div>Event Details</div>
              <div>Date & Time</div>
              <div className="text-center">Views</div>
              <div className="text-center">SEO</div>
              <div className="text-center">Status</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="divide-y">
              {pagedEvents.map((event) => {
                const isTrash = event.status === 'trash'
                const isSelected = selectedIds.has(event.id)
                const busy = actionLoading?.includes(event.id)
                const indexable = isEventIndexable(event)

                return (
                  <div
                    key={event.id}
                    className={cn(
                      'grid grid-cols-1 lg:grid-cols-[40px_minmax(0,1fr)_150px_80px_90px_100px_200px] gap-3 px-4 py-4 items-center transition-colors',
                      isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                    )}
                  >
                    <div className="hidden lg:flex justify-center">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectRow(event.id)}
                      />
                    </div>

                    <div className="flex items-start gap-3 min-w-0">
                      <div className="size-12 rounded-lg overflow-hidden bg-muted shrink-0 border">
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-muted-foreground">
                            <Calendar className="size-5 opacity-40" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/events/${event.id}`)}
                          className="text-sm font-semibold truncate block text-left hover:text-primary w-full"
                        >
                          {event.title}
                        </button>
                        <p className="text-[11px] text-muted-foreground flex items-start gap-1 mt-0.5">
                          <MapPin className="size-3 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {event.location || 'Online / TBA'}
                          </span>
                        </p>
                        {event.meta_title && (
                          <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">
                            OG: {event.meta_title}
                          </p>
                        )}
                        {event.is_featured && (
                          <span className="inline-block mt-1 text-[9px] font-bold uppercase text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground lg:block hidden">
                      <div>{formatDate(event.date)}</div>
                      {event.end_date && (
                        <div className="text-[10px] mt-0.5">
                          Ends: {formatDate(event.end_date)}
                        </div>
                      )}
                    </div>

                    <div className="text-sm font-medium text-center lg:block hidden">
                      {(event.views ?? 0).toLocaleString()}
                    </div>

                    <div className="lg:flex hidden flex-col items-center gap-1">
                      <SeoScoreBadge score={event.seo_score ?? 0} />
                      <OgReadiness event={event} />
                    </div>

                    <div className="lg:flex hidden justify-center">
                      <StatusBadge status={event.status} />
                    </div>

                    <div className="flex items-center justify-end gap-0.5 flex-wrap">
                      {isTrash ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Restore"
                            disabled={busy}
                            onClick={() => handleRestore(event)}
                          >
                            <RotateCcw className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete permanently"
                            disabled={busy}
                            className="text-destructive"
                            onClick={() => handlePermanentDelete(event)}
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
                            onClick={() => router.push(`/admin/events/${event.id}`)}
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          {indexable && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Submit to Google"
                                disabled={busy}
                                onClick={() => handleSingleIndex(event)}
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
                                  href={`/events/${event.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="size-3.5" />
                                </Link>
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Duplicate"
                            disabled={busy}
                            onClick={() => handleDuplicate(event)}
                          >
                            {actionLoading === `dup-${event.id}` ? (
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
                            onClick={() => handleTrash(event)}
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

            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
              <span>
                Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredEvents.length)}{' '}
                of {filteredEvents.length}
              </span>
              <div className="flex items-center gap-2">
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
