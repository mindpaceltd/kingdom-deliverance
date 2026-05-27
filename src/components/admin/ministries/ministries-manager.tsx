'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  GripVerticalIcon,
  CopyIcon,
  RotateCcw,
  TrashIcon,
  Radar,
  XIcon,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  reorderMinistries,
  trashMinistry,
  restoreMinistry,
  duplicateMinistry,
  deleteMinistry,
} from '@/lib/actions/ministries'
import { createClient } from '@/lib/supabase/client'
import { reportIndexingToast } from '@/lib/admin/report-indexing-toast'
import {
  collectPublishedUrls,
  getPublicIndexUrl,
  isPublishedForIndexing,
} from '@/lib/seo/content-indexing'
import { submitGoogleIndexing } from '@/lib/seo/submit-google-indexing-client'
import { StatusBadge } from '@/components/admin/status-badge'
import type { Ministry } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MinistriesManagerProps {
  initialMinistries: Ministry[]
}

const GRID_COLS =
  'grid-cols-[28px_28px_minmax(0,1fr)_minmax(0,140px)_88px_64px_56px_minmax(0,120px)]'

export function MinistriesManager({ initialMinistries }: MinistriesManagerProps) {
  const router = useRouter()
  const [ministries, setMinistries] = React.useState<Ministry[]>(initialMinistries)
  const [reordering, setReordering] = React.useState(false)
  const [filterStatus, setFilterStatus] = React.useState<string>('all')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [indexingId, setIndexingId] = React.useState<string | null>(null)
  const [bulkIndexing, setBulkIndexing] = React.useState(false)

  const dragIndexRef = React.useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  React.useEffect(() => {
    setMinistries(initialMinistries)
  }, [initialMinistries])

  const refreshMinistries = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('ministries')
      .select('*')
      .order('display_order', { ascending: true })
    if (data) setMinistries(data as Ministry[])
  }, [])

  const filteredMinistries = React.useMemo(() => {
    return ministries.filter((m) => filterStatus === 'all' || m.status === filterStatus)
  }, [ministries, filterStatus])

  const indexableInFilter = React.useMemo(
    () => filteredMinistries.filter(isPublishedForIndexing),
    [filteredMinistries]
  )

  const selectableIds = indexableInFilter.map((m) => m.id)
  const allPageSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))
  const somePageSelected =
    selectableIds.some((id) => selectedIds.has(id)) && !allPageSelected

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        selectableIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        selectableIds.forEach((id) => next.add(id))
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

  async function submitUrls(urls: string[]) {
    if (urls.length === 0) {
      toast.error('No published ministries with a slug to index.')
      return
    }
    const result = await submitGoogleIndexing(urls)
    reportIndexingToast(result)
  }

  async function handleIndexOne(ministry: Ministry) {
    if (!isPublishedForIndexing(ministry)) {
      toast.error('Only published ministries can be submitted to Google.')
      return
    }
    setIndexingId(ministry.id)
    await submitUrls([getPublicIndexUrl('ministry', ministry.slug)])
    setIndexingId(null)
  }

  async function handleBulkIndex() {
    const selected = ministries.filter((m) => selectedIds.has(m.id))
    setBulkIndexing(true)
    await submitUrls(collectPublishedUrls('ministry', selected))
    setBulkIndexing(false)
    setSelectedIds(new Set())
  }

  async function handleIndexAllPublished() {
    const urls = collectPublishedUrls('ministry', filteredMinistries)
    if (urls.length === 0) {
      toast.error('No published ministries in this list.')
      return
    }
    if (
      !window.confirm(`Submit ${urls.length} ministry URL(s) to Google for indexing?`)
    ) {
      return
    }
    setBulkIndexing(true)
    await submitUrls(urls)
    setBulkIndexing(false)
  }

  function openNew() {
    router.push('/admin/ministries/new')
  }

  function openEdit(ministry: Ministry) {
    router.push(`/admin/ministries/${ministry.id}`)
  }

  async function handleDuplicate(ministry: Ministry) {
    const result = await duplicateMinistry(ministry.id)
    if ('success' in result) await refreshMinistries()
    else toast.error(result.error)
  }

  async function handleTrash(ministry: Ministry) {
    if (!window.confirm(`Move "${ministry.name}" to trash?`)) return
    const result = await trashMinistry(ministry.id)
    if ('success' in result) await refreshMinistries()
    else toast.error(result.error)
  }

  async function handleRestore(ministry: Ministry) {
    const result = await restoreMinistry(ministry.id)
    if ('success' in result) await refreshMinistries()
    else toast.error(result.error)
  }

  async function handlePermanentDelete(ministry: Ministry) {
    if (!window.confirm(`Permanently delete "${ministry.name}"? This cannot be undone.`))
      return
    const result = await deleteMinistry(ministry.id)
    if ('success' in result) await refreshMinistries()
    else toast.error(result.error)
  }

  function handleDragStart(index: number) {
    dragIndexRef.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setDragOverIndex(index)
  }

  function handleDragLeave() {
    setDragOverIndex(null)
  }

  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault()
    setDragOverIndex(null)
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === dropIndex) return
    dragIndexRef.current = null

    const reordered = [...ministries]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    const updated = reordered.map((m, i) => ({ ...m, display_order: i + 1 }))
    setMinistries(updated)
    setReordering(true)
    await reorderMinistries(updated.map((m) => ({ id: m.id, display_order: m.display_order })))
    setReordering(false)
  }

  const bulkBusy = bulkIndexing || indexingId !== null

  return (
    <div className="space-y-4 p-6 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ministries</h1>
          <p className="text-sm text-muted-foreground">
            Manage ministry departments. Drag rows to reorder, bulk-submit to Google, and track
            page views.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bulkBusy || indexableInFilter.length === 0}
            onClick={() => void handleIndexAllPublished()}
          >
            <Radar className={`mr-2 size-4 ${bulkIndexing ? 'animate-pulse' : ''}`} />
            Index all published ({indexableInFilter.length})
          </Button>
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value ?? 'all')}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="trash">Trash</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openNew} size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Ministry
          </Button>
        </div>
      </div>

      {reordering && (
        <p className="text-xs text-primary animate-pulse font-medium">Saving display order…</p>
      )}

      <div className="rounded-lg border border-border overflow-hidden bg-background shadow-sm">
        <div
          className={cn(
            'grid gap-x-2 bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
            GRID_COLS
          )}
        >
          <span />
          <Checkbox
            checked={allPageSelected}
            indeterminate={somePageSelected}
            onChange={toggleSelectAll}
            disabled={selectableIds.length === 0}
            aria-label="Select all indexable ministries"
          />
          <span>Name</span>
          <span>Leader</span>
          <span>Status</span>
          <span className="text-center">Views</span>
          <span className="text-center">SEO</span>
          <span />
        </div>

        {filteredMinistries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground bg-background">
            <p className="text-sm">No ministries found.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {filteredMinistries.map((ministry, index) => {
              const canIndex = isPublishedForIndexing(ministry)
              return (
                <li
                  key={ministry.id}
                  draggable={filterStatus === 'all'}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={cn(
                    'grid gap-x-2 items-center px-3 py-3 transition-colors',
                    GRID_COLS,
                    dragOverIndex === index
                      ? 'bg-primary/5 border-t-2 border-primary'
                      : 'hover:bg-muted/30',
                    ministry.status === 'trash' && 'opacity-70'
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center text-muted-foreground',
                      filterStatus === 'all' ? 'cursor-grab' : 'opacity-20 cursor-not-allowed'
                    )}
                  >
                    <GripVerticalIcon className="size-4" />
                  </span>

                  <Checkbox
                    checked={selectedIds.has(ministry.id)}
                    onChange={() => toggleSelectRow(ministry.id)}
                    disabled={!canIndex}
                    aria-label={`Select ${ministry.name}`}
                  />

                  <div className="flex flex-col min-w-0">
                    <button
                      type="button"
                      onClick={() => openEdit(ministry)}
                      className="truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {ministry.name}
                    </button>
                    <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      /{ministry.slug}
                    </span>
                  </div>

                  <span className="truncate text-sm text-muted-foreground">
                    {ministry.leader ?? '—'}
                  </span>

                  <StatusBadge status={ministry.status} />

                  <div
                    className="flex items-center justify-center gap-1 text-xs text-muted-foreground"
                    title="Page views"
                  >
                    <Eye className="size-3 shrink-0" />
                    <span className="font-medium tabular-nums">
                      {(ministry.views ?? 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5">
                    <div
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        (ministry.seo_score ?? 0) >= 80
                          ? 'bg-green-600'
                          : (ministry.seo_score ?? 0) >= 50
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                      )}
                    />
                    <span className="text-xs font-medium">{ministry.seo_score ?? 0}</span>
                  </div>

                  <div className="flex items-center gap-0.5 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title="Submit to Google for indexing"
                      disabled={!canIndex || bulkBusy || indexingId === ministry.id}
                      onClick={() => void handleIndexOne(ministry)}
                    >
                      <Radar
                        className={cn(
                          'size-3.5',
                          indexingId === ministry.id && 'animate-pulse text-primary'
                        )}
                      />
                    </Button>
                    {ministry.status === 'trash' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void handleRestore(ministry)}
                          title="Restore"
                        >
                          <RotateCcw className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void handlePermanentDelete(ministry)}
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
                          onClick={() => void handleDuplicate(ministry)}
                          title="Duplicate"
                        >
                          <CopyIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(ministry)}
                          title="Edit"
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void handleTrash(ministry)}
                          title="Trash"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary text-primary-foreground shadow-xl"
          >
            <span className="text-sm font-bold border-r border-white/20 pr-3">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 hover:bg-white/10"
              disabled={bulkBusy}
              onClick={() => void handleBulkIndex()}
            >
              <Radar className={`size-3.5 mr-1.5 ${bulkIndexing ? 'animate-pulse' : ''}`} />
              Index on Google
            </Button>
            <button
              type="button"
              className="p-1 rounded-full hover:bg-white/10"
              aria-label="Clear selection"
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
