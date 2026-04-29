'use client'

import * as React from 'react'
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import { DataTable, type ColumnDef } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { deleteSermon } from '@/lib/actions/sermons'
import { createClient } from '@/lib/supabase/client'
import type { Sermon } from '@/lib/types'
import { SermonForm } from './sermon-form'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

/** Collect unique non-empty values from an array of sermons for a given key */
function uniqueValues(sermons: Sermon[], key: keyof Sermon): string[] {
  const seen = new Set<string>()
  for (const s of sermons) {
    const v = s[key]
    if (v && typeof v === 'string') seen.add(v)
  }
  return Array.from(seen).sort()
}

// ---------------------------------------------------------------------------
// SermonsManager
// ---------------------------------------------------------------------------

interface SermonsManagerProps {
  initialSermons: Sermon[]
}

export function SermonsManager({ initialSermons }: SermonsManagerProps) {
  const [sermons, setSermons] = React.useState<Sermon[]>(initialSermons)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingSermon, setEditingSermon] = React.useState<Sermon | null>(null)

  // Filter state
  const [filterPreacher, setFilterPreacher] = React.useState<string>('all')
  const [filterSeries, setFilterSeries] = React.useState<string>('all')
  const [filterDateFrom, setFilterDateFrom] = React.useState<string>('')
  const [filterDateTo, setFilterDateTo] = React.useState<string>('')

  // Derived option lists
  const preachers = React.useMemo(() => uniqueValues(sermons, 'preacher'), [sermons])
  const seriesList = React.useMemo(() => uniqueValues(sermons, 'series'), [sermons])

  // Re-fetch sermons from Supabase using the browser client
  const refreshSermons = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('sermons')
      .select('*')
      .order('date', { ascending: false })
    if (data) setSermons(data as Sermon[])
  }, [])

  function openNew() {
    setEditingSermon(null)
    setSheetOpen(true)
  }

  function openEdit(sermon: Sermon) {
    setEditingSermon(sermon)
    setSheetOpen(true)
  }

  async function handleDelete(sermon: Sermon) {
    if (!window.confirm(`Delete "${sermon.title}"? This cannot be undone.`)) return
    await deleteSermon(sermon.id)
    await refreshSermons()
  }

  function handleFormSuccess() {
    setSheetOpen(false)
    refreshSermons()
  }

  // Client-side filtering
  const filteredSermons = React.useMemo(() => {
    return sermons.filter((s) => {
      if (filterPreacher !== 'all' && s.preacher !== filterPreacher) return false
      if (filterSeries !== 'all' && s.series !== filterSeries) return false
      if (filterDateFrom && s.date < filterDateFrom) return false
      if (filterDateTo && s.date > filterDateTo) return false
      return true
    })
  }, [sermons, filterPreacher, filterSeries, filterDateFrom, filterDateTo])

  const columns: ColumnDef<Sermon>[] = [
    {
      key: 'title',
      header: 'Title',
      className: 'max-w-[220px]',
      cell: (sermon) => (
        <button
          type="button"
          onClick={() => openEdit(sermon)}
          className="truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline max-w-[200px] block"
          title={sermon.title}
        >
          {sermon.title}
        </button>
      ),
    },
    {
      key: 'preacher',
      header: 'Preacher',
      cell: (sermon) => (
        <span className="text-sm text-muted-foreground">{sermon.preacher}</span>
      ),
    },
    {
      key: 'series',
      header: 'Series',
      cell: (sermon) => (
        <span className="text-sm text-muted-foreground">{sermon.series ?? '—'}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (sermon) => (
        <span className="text-sm text-muted-foreground">{formatDate(sermon.date)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (sermon) => <StatusBadge status={sermon.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px]',
      cell: (sermon) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEdit(sermon)}
            aria-label={`Edit ${sermon.title}`}
          >
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(sermon)}
            aria-label={`Delete ${sermon.title}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const filterSlot = (
    <>
      {/* Preacher filter */}
      <Select value={filterPreacher} onValueChange={(v) => setFilterPreacher(v ?? 'all')}>
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue placeholder="All preachers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All preachers</SelectItem>
          {preachers.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Series filter */}
      <Select value={filterSeries} onValueChange={(v) => setFilterSeries(v ?? 'all')}>
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue placeholder="All series" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All series</SelectItem>
          {seriesList.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range */}
      <Input
        type="date"
        value={filterDateFrom}
        onChange={(e) => setFilterDateFrom(e.target.value)}
        className="h-9 w-[140px]"
        aria-label="Filter from date"
        title="From date"
      />
      <Input
        type="date"
        value={filterDateTo}
        onChange={(e) => setFilterDateTo(e.target.value)}
        className="h-9 w-[140px]"
        aria-label="Filter to date"
        title="To date"
      />
    </>
  )

  return (
    <div className="space-y-4 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sermons</h1>
          <p className="text-sm text-muted-foreground">
            Manage sermon recordings, notes, and publication status.
          </p>
        </div>
        <Button onClick={openNew} size="sm">
          <PlusIcon />
          New Sermon
        </Button>
      </div>

      {/* Table with filter bar */}
      <DataTable
        columns={columns}
        data={filteredSermons}
        searchPlaceholder="Search sermons…"
        filterSlot={filterSlot}
      />

      {/* Sheet — create / edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingSermon ? 'Edit Sermon' : 'New Sermon'}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <SermonForm
              sermon={editingSermon ?? undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
