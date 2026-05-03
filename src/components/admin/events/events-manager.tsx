'use client'

import * as React from 'react'
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
  ExternalLink
} from 'lucide-react'
import { DataTable, type ColumnDef } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
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
  deleteEvent 
} from '@/lib/actions/events'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types'
import { cn } from '@/lib/utils'

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateStr))
}

interface EventsManagerProps {
  initialEvents: Event[]
}

export function EventsManager({ initialEvents }: EventsManagerProps) {
  const router = useRouter()
  const [events, setEvents] = React.useState<Event[]>(initialEvents)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [filterStatus, setFilterStatus] = React.useState<string>('all')

  const refreshEvents = React.useCallback(async () => {
    setIsRefreshing(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })
    if (data) setEvents(data as Event[])
    setIsRefreshing(false)
  }, [])

  function openNew() {
    router.push('/admin/events/new')
  }

  function openEdit(event: Event) {
    router.push(`/admin/events/${event.id}`)
  }

  async function handleDuplicate(event: Event) {
    setIsRefreshing(true)
    const result = await duplicateEvent(event.id)
    if ('success' in result && 'id' in result) {
      router.push(`/admin/events/${result.id}`)
      router.refresh()
    } else {
      setIsRefreshing(false)
      alert('error' in result ? result.error : 'Duplication failed')
    }
  }

  async function handleTrash(event: Event) {
    if (!window.confirm(`Move "${event.title}" to trash?`)) return
    const result = await trashEvent(event.id)
    if ('success' in result) {
      await refreshEvents()
    } else {
      alert(result.error)
    }
  }

  async function handleRestore(event: Event) {
    const result = await restoreEvent(event.id)
    if ('success' in result) {
      await refreshEvents()
    } else {
      alert(result.error)
    }
  }

  async function handlePermanentDelete(event: Event) {
    if (!window.confirm(`Permanently delete "${event.title}"? This cannot be undone.`)) return
    const result = await deleteEvent(event.id)
    if ('success' in result) {
      await refreshEvents()
    } else {
      alert(result.error)
    }
  }

  const filteredEvents = React.useMemo(() => {
    return events.filter((e) => filterStatus === 'all' || e.status === filterStatus)
  }, [events, filterStatus])

  const columns: ColumnDef<Event>[] = [
    {
      key: 'title',
      header: 'Event Details',
      className: 'max-w-[350px]',
      cell: (event) => (
        <div className="flex items-start gap-3">
          <div className="mt-1 h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
            {event.image_url ? (
              <img src={event.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/5">
                <Calendar className="h-4 w-4 text-primary/40" />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <button
              type="button"
              onClick={() => openEdit(event)}
              className="truncate text-left text-sm font-semibold text-foreground hover:text-accent transition-colors"
              title={event.title}
            >
              {event.title}
            </button>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                <MapPin className="size-3" />
                {event.location || 'Online / TBA'}
              </span>
              {event.is_featured && (
                <span className="bg-accent/10 text-accent text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm">Featured</span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date & Time',
      cell: (event) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground" suppressHydrationWarning>
            {formatDate(event.date)}
          </span>
          {event.end_date && (
            <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
              Ends: {formatDate(event.end_date)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Reach',
      cell: (event) => (
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium">{event.views?.toLocaleString() ?? 0}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Views</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (event) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={event.status} />
          {event.status === 'published' || event.status === 'upcoming' ? (
             <a 
               href={`/events/${event.slug}`} 
               target="_blank" 
               rel="noreferrer"
               className="text-[10px] text-accent flex items-center gap-1 hover:underline"
             >
               View Live <ExternalLink className="size-2.5" />
             </a>
          ) : null}
        </div>
      ),
    },
    {
      key: 'seo_score',
      header: 'SEO',
      cell: (event) => {
        const score = event.seo_score ?? 0
        return (
          <div className="group relative flex flex-col items-start gap-1">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "h-2 w-2 rounded-full",
                score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              )} />
              <span className={cn(
                "text-sm font-bold",
                score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
              )}>{score}</span>
            </div>
            <div className="h-1 w-12 bg-muted rounded-full overflow-hidden">
               <div className={cn(
                 "h-full rounded-full transition-all",
                 score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
               )} style={{ width: `${score}%` }} />
            </div>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[140px]',
      cell: (event) => (
        <div className="flex items-center gap-1 justify-end">
          {event.status === 'trash' ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRestore(event)}
                title="Restore"
                className="hover:bg-green-50 hover:text-green-600"
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handlePermanentDelete(event)}
                title="Delete Permanently"
                className="text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDuplicate(event)}
                title="Duplicate"
                className="hover:bg-primary/5"
              >
                <CopyIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => openEdit(event)}
                title="Edit"
                className="hover:bg-primary/5 text-primary"
              >
                <PencilIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleTrash(event)}
                title="Trash"
                className="text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  const filterSlot = (
    <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
      <SelectTrigger className="h-9 w-[160px] bg-card">
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
  )

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage church programs, conferences, and community gatherings.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={refreshEvents} variant="outline" size="sm" className="h-9 px-3" disabled={isRefreshing}>
             <RotateCcw className={cn("size-4 mr-2", isRefreshing && "animate-spin")} />
             Refresh
           </Button>
           <Button onClick={openNew} size="sm" className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
             <PlusIcon className="mr-2 h-4 w-4" />
             New Event
           </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm">
        <DataTable
          columns={columns}
          data={filteredEvents}
          searchPlaceholder="Search events by title, location..."
          filterSlot={filterSlot}
          isLoading={isRefreshing}
        />
      </div>
    </div>
  )
}

