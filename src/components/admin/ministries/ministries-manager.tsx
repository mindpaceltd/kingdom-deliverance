'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, PencilIcon, Trash2Icon, GripVerticalIcon, CopyIcon, RotateCcw, TrashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  reorderMinistries, 
  trashMinistry, 
  restoreMinistry, 
  duplicateMinistry, 
  deleteMinistry 
} from '@/lib/actions/ministries'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/admin/status-badge'
import type { Ministry } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MinistriesManagerProps {
  initialMinistries: Ministry[]
}

export function MinistriesManager({ initialMinistries }: MinistriesManagerProps) {
  const router = useRouter()
  const [ministries, setMinistries] = React.useState<Ministry[]>(initialMinistries)
  const [reordering, setReordering] = React.useState(false)
  const [filterStatus, setFilterStatus] = React.useState<string>('all')

  // Drag-and-drop state
  const dragIndexRef = React.useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const refreshMinistries = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('ministries')
      .select('*')
      .order('display_order', { ascending: true })
    if (data) setMinistries(data as Ministry[])
  }, [])

  function openNew() {
    router.push('/admin/ministries/new')
  }

  function openEdit(ministry: Ministry) {
    router.push(`/admin/ministries/${ministry.id}`)
  }

  async function handleDuplicate(ministry: Ministry) {
    const result = await duplicateMinistry(ministry.id)
    if ('success' in result) await refreshMinistries()
    else alert(result.error)
  }

  async function handleTrash(ministry: Ministry) {
    if (!window.confirm(`Move "${ministry.name}" to trash?`)) return
    const result = await trashMinistry(ministry.id)
    if ('success' in result) await refreshMinistries()
    else alert(result.error)
  }

  async function handleRestore(ministry: Ministry) {
    const result = await restoreMinistry(ministry.id)
    if ('success' in result) await refreshMinistries()
    else alert(result.error)
  }

  async function handlePermanentDelete(ministry: Ministry) {
    if (!window.confirm(`Permanently delete "${ministry.name}"? This cannot be undone.`)) return
    const result = await deleteMinistry(ministry.id)
    if ('success' in result) await refreshMinistries()
    else alert(result.error)
  }

  // ── Drag-and-drop handlers ──────────────────────────────────────────────

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

    // Reorder local state
    const reordered = [...ministries]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)

    // Assign new display_order values (1-based)
    const updated = reordered.map((m, i) => ({ ...m, display_order: i + 1 }))
    setMinistries(updated)

    // Persist to server
    setReordering(true)
    await reorderMinistries(updated.map((m) => ({ id: m.id, display_order: m.display_order })))
    setReordering(false)
  }

  const filteredMinistries = React.useMemo(() => {
    return ministries.filter((m) => filterStatus === 'all' || m.status === filterStatus)
  }, [ministries, filterStatus])

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ministries</h1>
          <p className="text-sm text-muted-foreground">
            Manage ministry departments. Drag rows to reorder.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
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
        <div className="grid grid-cols-[32px_1fr_160px_100px_80px_120px] gap-x-3 bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span />
          <span>Name</span>
          <span>Leader</span>
          <span>Status</span>
          <span className="text-center">SEO</span>
          <span />
        </div>

        {filteredMinistries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground bg-background">
            <p className="text-sm">No ministries found.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {filteredMinistries.map((ministry, index) => (
              <li
                key={ministry.id}
                draggable={filterStatus === 'all'}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  'grid grid-cols-[32px_1fr_160px_100px_80px_120px] gap-x-3 items-center px-3 py-3 transition-colors',
                  dragOverIndex === index ? 'bg-primary/5 border-t-2 border-primary' : 'hover:bg-muted/30',
                  ministry.status === 'trash' && 'opacity-70'
                )}
              >
                {/* Drag handle */}
                <span className={cn(
                  "flex items-center justify-center text-muted-foreground",
                  filterStatus === 'all' ? "cursor-grab" : "opacity-20 cursor-not-allowed"
                )}>
                  <GripVerticalIcon className="size-4" />
                </span>

                {/* Name */}
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => openEdit(ministry)}
                    className="truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    {ministry.name}
                  </button>
                  <span className="text-[11px] text-muted-foreground mt-0.5">/{ministry.slug}</span>
                </div>

                {/* Leader */}
                <span className="truncate text-sm text-muted-foreground">
                  {ministry.leader ?? '—'}
                </span>

                {/* Status */}
                <StatusBadge status={ministry.status} />

                {/* SEO Score */}
                <div className="flex items-center justify-center gap-1.5">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    (ministry.seo_score ?? 0) >= 80 ? 'bg-green-600' : (ministry.seo_score ?? 0) >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                  )} />
                  <span className="text-xs font-medium">{ministry.seo_score ?? 0}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 justify-end">
                  {ministry.status === 'trash' ? (
                    <>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleRestore(ministry)} title="Restore">
                        <RotateCcw className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handlePermanentDelete(ministry)} title="Delete Permanently" className="text-destructive hover:text-destructive">
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDuplicate(ministry)} title="Duplicate">
                        <CopyIcon className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(ministry)} title="Edit">
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleTrash(ministry)} title="Trash" className="text-destructive hover:text-destructive">
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// Minimal select components for brevity if they weren't imported
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
