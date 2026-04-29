'use client'

import * as React from 'react'
import { PlusIcon, PencilIcon, Trash2Icon, GripVerticalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { reorderMinistries } from '@/lib/actions/ministries'
import { createClient } from '@/lib/supabase/client'
import type { Ministry } from '@/lib/types'
import { MinistryForm } from './ministry-form'
import { cn } from '@/lib/utils'

interface MinistriesManagerProps {
  initialMinistries: Ministry[]
}

export function MinistriesManager({ initialMinistries }: MinistriesManagerProps) {
  const [ministries, setMinistries] = React.useState<Ministry[]>(initialMinistries)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingMinistry, setEditingMinistry] = React.useState<Ministry | null>(null)
  const [reordering, setReordering] = React.useState(false)

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
    setEditingMinistry(null)
    setSheetOpen(true)
  }

  function openEdit(ministry: Ministry) {
    setEditingMinistry(ministry)
    setSheetOpen(true)
  }

  async function handleDelete(ministry: Ministry) {
    if (!window.confirm(`Delete "${ministry.name}"? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from('ministries').delete().eq('id', ministry.id)
    await refreshMinistries()
  }

  function handleFormSuccess() {
    setSheetOpen(false)
    refreshMinistries()
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

  function handleDragEnd() {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ministries</h1>
          <p className="text-sm text-muted-foreground">
            Manage ministry departments. Drag rows to reorder.
          </p>
        </div>
        <Button onClick={openNew} size="sm">
          <PlusIcon />
          New Ministry
        </Button>
      </div>

      {reordering && (
        <p className="text-xs text-muted-foreground">Saving order…</p>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[32px_1fr_160px_100px_80px_80px] gap-x-3 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span />
          <span>Name</span>
          <span>Leader</span>
          <span>Active</span>
          <span>Order</span>
          <span />
        </div>

        {ministries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <p className="text-sm">No ministries yet.</p>
            <Button variant="outline" size="sm" onClick={openNew}>
              <PlusIcon />
              Add your first ministry
            </Button>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {ministries.map((ministry, index) => (
              <li
                key={ministry.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'grid grid-cols-[32px_1fr_160px_100px_80px_80px] gap-x-3 items-center px-3 py-2.5 transition-colors',
                  dragOverIndex === index
                    ? 'bg-primary/10 border-t-2 border-primary'
                    : 'hover:bg-muted/30'
                )}
              >
                {/* Drag handle */}
                <span className="flex items-center justify-center cursor-grab text-muted-foreground">
                  <GripVerticalIcon className="size-4" />
                </span>

                {/* Name */}
                <button
                  type="button"
                  onClick={() => openEdit(ministry)}
                  className="truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline"
                  title={ministry.name}
                >
                  {ministry.name}
                </button>

                {/* Leader */}
                <span className="truncate text-sm text-muted-foreground">
                  {ministry.leader ?? '—'}
                </span>

                {/* Active */}
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium w-fit',
                    ministry.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {ministry.is_active ? 'Active' : 'Inactive'}
                </span>

                {/* Display order */}
                <span className="text-sm text-muted-foreground text-center">
                  {ministry.display_order}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(ministry)}
                    aria-label={`Edit ${ministry.name}`}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(ministry)}
                    aria-label={`Delete ${ministry.name}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingMinistry ? 'Edit Ministry' : 'New Ministry'}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <MinistryForm
              ministry={editingMinistry ?? undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
