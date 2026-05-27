'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  Trash2Icon,
  GripVerticalIcon,
  UploadIcon,
  XIcon,
  Search,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GalleryBulkUpload } from '@/components/admin/gallery/gallery-bulk-upload'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  bulkDeleteGalleryItems,
  deleteGalleryItem,
  reorderGallery,
  updateGalleryItem,
} from '@/lib/actions/gallery'
import { GalleryCaptionOverlay } from '@/components/gallery/gallery-caption-overlay'
import { resolveGalleryCaption } from '@/lib/gallery-caption'
import { createClient } from '@/lib/supabase/client'
import type { GalleryItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GalleryManagerProps {
  initialItems: GalleryItem[]
}

function matchesGallerySearch(item: GalleryItem, query: string): boolean {
  const q = query.toLowerCase()
  return (
    (item.title?.toLowerCase().includes(q) ?? false) ||
    (item.description?.toLowerCase().includes(q) ?? false) ||
    (item.album?.toLowerCase().includes(q) ?? false) ||
    item.image_url.toLowerCase().includes(q)
  )
}

export function GalleryManager({ initialItems }: GalleryManagerProps) {
  const [items, setItems] = React.useState<GalleryItem[]>(initialItems)
  const [showUpload, setShowUpload] = React.useState(false)
  const [reordering, setReordering] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<GalleryItem | null>(null)
  const [searchInput, setSearchInput] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = React.useState(false)

  const [editForm, setEditForm] = React.useState({
    title: '',
    description: '',
    album: '',
  })
  const [editSaving, setEditSaving] = React.useState(false)

  const dragIndexRef = React.useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const filteredItems = React.useMemo(() => {
    const q = searchInput.trim()
    if (!q) return items
    return items.filter((item) => matchesGallerySearch(item, q))
  }, [items, searchInput])

  const searchActive = searchInput.trim().length > 0

  React.useEffect(() => {
    if (selectedItem) {
      setEditForm({
        title: selectedItem.title || '',
        description: selectedItem.description || '',
        album: selectedItem.album || 'General',
      })
    }
  }, [selectedItem])

  const refreshItems = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('display_order', { ascending: true })
    if (data) setItems(data as GalleryItem[])
  }, [])

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisible() {
    setSelectedIds(new Set(filteredItems.map((i) => i.id)))
  }

  async function handleDelete() {
    if (!selectedItem || !window.confirm(`Permanently delete this gallery image?`)) return
    const result = await deleteGalleryItem(selectedItem.id)
    if ('error' in result) {
      alert(result.error)
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== selectedItem.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(selectedItem.id)
      return next
    })
    setSelectedItem(null)
  }

  async function handleBulkDelete() {
    const count = selectedIds.size
    if (
      count === 0 ||
      !window.confirm(`Permanently delete ${count} selected image${count === 1 ? '' : 's'}?`)
    ) {
      return
    }
    setBulkDeleting(true)
    const result = await bulkDeleteGalleryItems([...selectedIds])
    setBulkDeleting(false)
    if ('error' in result) {
      alert(result.error)
      return
    }
    setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)))
    if (selectedItem && selectedIds.has(selectedItem.id)) {
      setSelectedItem(null)
    }
    setSelectedIds(new Set())
    if (result.failed > 0) {
      alert(`Deleted ${result.deleted} image(s). ${result.failed} could not be deleted.`)
    }
  }

  async function handleUpdate() {
    if (!selectedItem) return
    setEditSaving(true)
    const result = await updateGalleryItem(selectedItem.id, editForm)
    setEditSaving(false)
    if ('success' in result) {
      setItems((prev) =>
        prev.map((i) => (i.id === selectedItem.id ? { ...i, ...editForm } : i))
      )
      setSelectedItem((prev) => (prev ? { ...prev, ...editForm } : null))
    } else {
      alert(result.error)
    }
  }

  function handleDragStart(index: number) {
    if (searchActive) return
    dragIndexRef.current = index
  }
  function handleDragOver(e: React.DragEvent, index: number) {
    if (searchActive) return
    e.preventDefault()
    setDragOverIndex(index)
  }
  function handleDragLeave() {
    setDragOverIndex(null)
  }
  function handleDragEnd() {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    if (searchActive) return
    e.preventDefault()
    setDragOverIndex(null)
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === dropIndex) return
    dragIndexRef.current = null
    const reordered = [...items]
    const dragId = filteredItems[dragIndex]?.id
    const dropId = filteredItems[dropIndex]?.id
    const fromIndex = reordered.findIndex((i) => i.id === dragId)
    const toIndex = reordered.findIndex((i) => i.id === dropId)
    if (fromIndex < 0 || toIndex < 0) return
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
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
          <p className="text-sm text-muted-foreground">
            Manage gallery images and albums.
            {searchActive ? ' Clear search to drag and reorder.' : ' Drag cards to reorder.'}
          </p>
        </div>
        <Button onClick={() => setShowUpload((v) => !v)} size="sm" variant={showUpload ? 'secondary' : 'default'}>
          {showUpload ? (
            <>
              <XIcon className="mr-2 size-4" /> Cancel
            </>
          ) : (
            <>
              <UploadIcon className="mr-2 size-4" /> Bulk Upload
            </>
          )}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search title, caption, album, or URL…"
          className="pl-9"
          aria-label="Search gallery"
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button variant="ghost" size="sm" className="h-8" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={selectAllVisible}>
            Select all {searchActive ? 'shown' : ''}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8"
            disabled={bulkDeleting}
            onClick={handleBulkDelete}
          >
            {bulkDeleting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2Icon className="mr-2 size-4" /> Delete selected
              </>
            )}
          </Button>
        </div>
      )}

      {showUpload && (
        <div className="rounded-xl border-2 border-dashed border-border p-8 bg-muted/20">
          <p className="mb-4 text-sm font-medium">
            Bulk upload — select or drag many images at once. They are added to the &quot;General&quot; album.
          </p>
          <GalleryBulkUpload
            onComplete={async () => {
              await refreshItems()
              setShowUpload(false)
            }}
          />
        </div>
      )}

      {reordering && <p className="text-xs text-primary font-medium">Saving order…</p>}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-24 text-muted-foreground">
          <p className="text-sm font-medium">Your gallery is empty.</p>
          <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
            <UploadIcon className="mr-2 size-4" /> Upload first image
          </Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          No images match &quot;{searchInput.trim()}&quot;.
        </div>
      ) : (
        <ul
          role="list"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          {filteredItems.map((item, index) => {
            const label = resolveGalleryCaption({
              description: item.description,
              title: item.title,
              image_url: item.image_url,
              album: item.album,
            })
            const checked = selectedIds.has(item.id)
            return (
              <li
                key={item.id}
                draggable={!searchActive}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'group relative min-w-0 cursor-pointer overflow-hidden rounded-lg border bg-card transition-all',
                  dragOverIndex === index
                    ? 'ring-2 ring-primary border-primary'
                    : 'border-transparent hover:border-primary/20',
                  selectedItem?.id === item.id || checked
                    ? 'ring-2 ring-primary border-primary'
                    : ''
                )}
                onClick={() => setSelectedItem(item)}
              >
                <span
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelected(item.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleSelected(item.id)
                    }
                  }}
                  className={cn(
                    'absolute left-1.5 top-1.5 z-30 flex size-5 items-center justify-center rounded border shadow-sm transition-opacity',
                    checked
                      ? 'border-primary bg-primary text-primary-foreground opacity-100'
                      : 'border-white/80 bg-black/50 text-white opacity-0 group-hover:opacity-100'
                  )}
                >
                  {checked && <Check className="size-3" strokeWidth={3} />}
                </span>

                <div className="relative aspect-square w-full bg-muted">
                  {!searchActive && (
                    <div className="absolute left-8 top-1 z-20 cursor-grab rounded-full bg-black/50 p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                      <GripVerticalIcon className="size-3 text-white" />
                    </div>
                  )}
                  <Image
                    src={item.image_url}
                    alt={label}
                    fill
                    sizes="(max-width: 640px) 50vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  <GalleryCaptionOverlay caption={label} className="z-[11]" />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto px-0">
          <SheetHeader className="px-6 pb-4 border-b border-border">
            <SheetTitle>Image Details</SheetTitle>
          </SheetHeader>

          {selectedItem && (
            <div className="flex flex-col">
              <div className="p-6 bg-muted/30 flex items-center justify-center border-b border-border">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border shadow-sm bg-white">
                  <Image
                    src={selectedItem.image_url}
                    alt={selectedItem.title ?? 'Preview'}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Image title
                    </Label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Shown as caption if no description is set"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Album
                    </Label>
                    <Input
                      value={editForm.album}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, album: e.target.value }))}
                      placeholder="e.g. Easter 2024"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Caption
                    </Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Public caption (preferred). Leave empty to use image title above."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>Order: #{selectedItem.display_order}</span>
                    <span>Added: {new Date(selectedItem.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-background p-6 border-t border-border flex items-center justify-between gap-3">
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={editSaving}>
                  <Trash2Icon className="mr-2 size-4" /> Delete Permanently
                </Button>
                <Button size="sm" onClick={handleUpdate} disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
