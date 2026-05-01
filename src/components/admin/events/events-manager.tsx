'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, PencilIcon, Trash2Icon, CopyIcon, RotateCcw, TrashIcon } from 'lucide-react'
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

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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
    const result = await duplicateEvent(event.id)
    if ('success' in result) {
      await refreshEvents()
    } else {
      alert(result.error)
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
      header: 'Title',
      className: 'max-w-[250px]',
      cell: (event) => (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => openEdit(event)}
            className="truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline block"
            title={event.title}
          >
            {event.title}
          </button>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {event.location || 'No location'}
          </span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Event Date',
      cell: (event) => (
        <span className="text-sm text-muted-foreground">{formatDate(event.date)}</span>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      cell: (event) => (
        <span className="text-sm text-muted-foreground">{event.views?.toLocaleString() ?? 0}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (event) => <StatusBadge status={event.status} />,
    },
    {
      key: 'seo_score',
      header: 'SEO',
      cell: (event) => {
        const score = event.seo_score ?? 0
        return (
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${score >= 80 ? 'bg-green-600' : score >= 50 ? 'bg-yellow-600' : 'bg-red-600'}`} />
            <span className={`text-sm font-medium ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{score}</span>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[120px]',
      cell: (event) => (
        <div className="flex items-center gap-1 justify-end">
          {event.status === 'trash' ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRestore(event)}
                title="Restore"
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handlePermanentDelete(event)}
                title="Delete Permanently"
                className="text-destructive hover:text-destructive"
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
              >
                <CopyIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => openEdit(event)}
                title="Edit"
              >
                <PencilIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleTrash(event)}
                title="Trash"
                className="text-destructive hover:text-destructive"
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
      <SelectTrigger className="h-9 w-[160px]">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="published">Published</SelectItem>
        <SelectItem value="scheduled">Scheduled</SelectItem>
        <SelectItem value="trash">Trash</SelectItem>
        <SelectItem value="upcoming">Upcoming (Legacy)</SelectItem>
        <SelectItem value="past">Past (Legacy)</SelectItem>
      </SelectContent>
    </Select>
  )

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground">
            Manage upcoming programs, conferences, and service schedules.
          </p>
        </div>
        <Button onClick={openNew} size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredEvents}
        searchPlaceholder="Search events…"
        filterSlot={filterSlot}
        isLoading={isRefreshing}
      />
    </div>
  )
}
