'use client'

import * as React from 'react'
import Image from 'next/image'
import { Trash2Icon, GripVerticalIcon, UploadIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadZone } from '@/components/admin/upload-zone'
import { createGalleryItem, deleteGalleryItem, reorderGallery } from '@/lib/actions/gallery'
import { createClient } from '@/lib/supabase/client'
import type { GalleryItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GalleryManagerProps {
  initialItems: GalleryItem[]
}

export function GalleryManager({ initialItems }: GalleryManagerProps) {
  const [items, setItems] = React.useState<GalleryItem[]>(initialItems)
  const [showUpload, setShowUpload] = React.useState(false)
  const [reordering, setReordering] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const dragIndexRef = React.useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const refreshItems = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('display_order', { ascending: true })
    if (data) setItems(data as GalleryItem[])
  }, [])

  async function handleUploadComplete(url: string) {
    const nextOrder =
      items.length > 0 ? Math.max(...items.map((i) => i.display_order)) + 1 : 1
    setSaving(true)
    const result = await createGalleryItem({ image_url: url, album: 'General', display_order: nextOrder })
    setSaving(false)
    if ('error' in result) {
      console.error('[GalleryManager] createGalleryItem error:', result.error)
      return
    }
    await refreshItems()
  }

  async function handleDelete(item: GalleryItem) {
    const label = item.title ? `"${item.title}"` : 'this image'
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return
    const result = await deleteGalleryItem(item.id)
    if ('error' in result) {
      console.error('[GalleryManager] deleteGalleryItem error:', result.error)
      return
    }
    await refreshItems()
  }

  function handleDragStart(index: number) { dragIndexRef.current = index }
  function handleDragOver(e: React.DragEvent, index: number) { e.preventDefault(); setDragOverIndex(index) }
  function handleDragLeave() { setDragOverIndex(null) }
  function handleDragEnd() { dragIndexRef.current = null; setDragOverIndex(null) }

  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault()
    setDragOverIndex(null)
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === dropIndex) return
    dragIndexRef.current = null
    const reordered = [...items]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    const updated = reordered.map((item, i) => ({ ...item, display_order: i + 1 }))
    setItems(updated)
    setReordering(true)
    await reorderGallery(updated.map((item) => ({ id: item.id, display_order: item.display_order })))
    setReordering(false)
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Gallery</h1>
          <p className="text-sm text-muted-foreground">Manage gallery images. Drag cards to reorder.</p>
        </div>
        <Button onClick={() => setShowUpload((v) => !v)} size="sm" variant={showUpload ? 'secondary' : 'default'}>
          {showUpload ? <><XIcon className="size-4" /> Cancel</> : <><UploadIcon className="size-4" /> Upload</>}
        </Button>
      </div>

      {showUpload && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm font-medium">Upload images — added to &quot;General&quot; album automatically.</p>
          <UploadZone accept="image/jpeg,image/png,image/webp,image/gif" onUploadComplete={handleUploadComplete} />
          {saving && <p className="mt-2 text-xs text-muted-foreground">Saving gallery item…</p>}
        </div>
      )}

      {reordering && <p className="text-xs text-muted-foreground">Saving order…</p>}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-muted-foreground">
          <p className="text-sm">No gallery images yet.</p>
          <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
            <UploadIcon className="size-4" /> Upload your first image
          </Button>
        </div>
      ) : (
        <ul role="list" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item, index) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow',
                dragOverIndex === index ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
              )}
            >
              <div className="absolute left-1.5 top-1.5 z-10 cursor-grab rounded bg-black/40 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVerticalIcon className="size-3.5 text-white" />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item)}
                aria-label={`Delete ${item.title ?? 'image'}`}
                className="absolute right-1.5 top-1.5 z-10 rounded bg-black/40 p-0.5 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
              >
                <Trash2Icon className="size-3.5" />
              </button>
              <div className="relative aspect-square w-full overflow-hidden bg-muted">
                <Image
                  src={item.image_url}
                  alt={item.title ?? 'Gallery image'}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex flex-col gap-0.5 p-2">
                <p className="truncate text-xs font-medium text-foreground" title={item.title ?? undefined}>
                  {item.title ?? <span className="italic text-muted-foreground">Untitled</span>}
                </p>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs text-muted-foreground">{item.album}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">#{item.display_order}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
