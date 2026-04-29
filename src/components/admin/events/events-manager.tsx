'use client'

import * as React from 'react'
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { deleteEvent } from '@/lib/actions/events'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types'
import { EventForm } from './event-form'

function formatDate(dateStr: string): string {
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
  const [events, setEvents] = React.useState<Event[]>(initialEvents)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingEvent, setEditingEvent] = React.useState<Event | null>(null)
  const [filterStatus, setFilterStatus] = React.useState<string>('all')

  const refreshEvents = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })
    if (data) setEvents(data as Event[])
  }, [])

  function openNew() {
    setEditingEvent(null)
    setSheetOpen(true)
  }

  function openEdit(event: Event) {
    setEditingEvent(event)
    setSheetOpen(true)
  }

  async function handleDelete(event: Event) {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    await deleteEvent(event.id)
    await refreshEvents()
  }

  function handleFormSuccess() {
    setSheetOpen(false)
    refreshEvents()
  }

  const filteredEvents = React.useMemo(() => {
    return events.filter((e) => filterStatus === 'all' || e.status === filterStatus)
  }, [events, filterStatus])

  const columns: ColumnDef<Event>[] = [
    {
      key: 'title',
      header: 'Title',
      className: 'max-w-[220px]',
      cell: (event) => (
        <button
          type="button"
          onClick={() => openEdit(event)}
          className="truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline max-w-[200px] block"
          title={event.title}
        >
          {event.title}
        </button>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (event) => (
        <span className="text-sm text-muted-foreground">{formatDate(event.date)}</span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (event) => (
        <span className="text-sm text-muted-foreground">{event.location ?? '—'}</span>
      ),
    },
    {
      key: 'is_featured',
      header: 'Featured',
      cell: (event) => (
        <span className="text-sm text-muted-foreground">{event.is_featured ? '✓' : '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (event) => <StatusBadge status={event.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px]',
      cell: (event) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEdit(event)}
            aria-label={`Edit ${event.title}`}
          >
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(event)}
            aria-label={`Delete ${event.title}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
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
        <SelectItem value="upcoming">Upcoming</SelectItem>
        <SelectItem value="ongoing">Ongoing</SelectItem>
        <SelectItem value="past">Past</SelectItem>
        <SelectItem value="cancelled">Cancelled</SelectItem>
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
          <PlusIcon />
          New Event
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredEvents}
        searchPlaceholder="Search events…"
        filterSlot={filterSlot}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingEvent ? 'Edit Event' : 'New Event'}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <EventForm
              event={editingEvent ?? undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
