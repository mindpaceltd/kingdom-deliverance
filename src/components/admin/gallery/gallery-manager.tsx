'use client'

import * as React from 'react'
import Image from 'next/image'
import { Trash2Icon, GripVerticalIcon, UploadIcon, XIcon, Check, Copy, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UploadZone } from '@/components/admin/upload-zone'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  createGalleryItemsBulk,
  deleteGalleryItem,
  reorderGallery,
  updateGalleryItem,
} from '@/lib/actions/gallery'
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
  const [selectedItem, setSelectedItem] = React.useState<GalleryItem | null>(null)
  
  // Edit state
  const [editForm, setEditForm] = React.useState({
    title: '',
    description: '',
    album: '',
  })
  const [editSaving, setEditSaving] = React.useState(false)

  const dragIndexRef = React.useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

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

  async function handleBulkUpload(urls: string[]) {
    if (urls.length === 0) return
    setSaving(true)
    const result = await createGalleryItemsBulk(urls, 'General')
    setSaving(false)
    if ('error' in result) {
      alert(result.error)
      return
    }
    await refreshItems()
    setShowUpload(false)
  }

  async function handleDelete() {
    if (!selectedItem || !window.confirm(`Permanently delete this gallery image?`)) return
    const result = await deleteGalleryItem(selectedItem.id)
    if ('error' in result) {
      alert(result.error)
      return
    }
    setItems(prev => prev.filter(i => i.id !== selectedItem.id))
    setSelectedItem(null)
  }

  async function handleUpdate() {
    if (!selectedItem) return
    setEditSaving(true)
    const result = await updateGalleryItem(selectedItem.id, editForm)
    setEditSaving(false)
    if ('success' in result) {
      setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, ...editForm } : i))
      setSelectedItem(prev => prev ? { ...prev, ...editForm } : null)
    } else {
      alert(result.error)
    }
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
          <p className="text-sm text-muted-foreground">Manage gallery images and albums. Drag cards to reorder.</p>
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

      {showUpload && (
        <div className="rounded-xl border-2 border-dashed border-border p-8 bg-muted/20">
          <p className="mb-4 text-sm font-medium">
            Bulk upload — select or drag many images at once. They are added to the &quot;General&quot; album.
          </p>
          <UploadZone
            accept="image/*"
            onBatchComplete={handleBulkUpload}
            hint="Select multiple images (Cmd/Ctrl+click or Shift+click) — max 50 MB each."
          />
          {saving && (
            <p className="mt-3 text-xs font-medium text-primary animate-pulse">
              Saving gallery images…
            </p>
          )}
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
      ) : (
        <ul role="list" className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
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
                'group relative flex aspect-square cursor-pointer flex-col overflow-hidden rounded-md border bg-card transition-all',
                dragOverIndex === index ? 'ring-2 ring-primary border-primary' : 'border-transparent hover:border-primary/20',
                selectedItem?.id === item.id ? 'ring-2 ring-primary border-primary' : ''
              )}
              onClick={() => setSelectedItem(item)}
            >
              <div className="absolute left-1.5 top-1.5 z-10 cursor-grab rounded-full bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100 shadow-sm">
                <GripVerticalIcon className="size-3 text-white" />
              </div>
              
              <div className="relative h-full w-full overflow-hidden bg-muted">
                <Image
                  src={item.image_url}
                  alt={item.title ?? 'Gallery image'}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              </div>

              {/* Album badge */}
              <div className="absolute bottom-2 left-2 z-10">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 px-1.5 py-0.5 rounded shadow-sm">
                    {item.album}
                 </span>
              </div>
              
              <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                 <span className="text-[10px] font-medium text-white px-2 py-1 bg-black/60 rounded-full">Edit Details</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Details Sheet */}
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
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</Label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Display title (optional)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Album</Label>
                    <Input
                      value={editForm.album}
                      onChange={(e) => setEditForm(prev => ({ ...prev, album: e.target.value }))}
                      placeholder="e.g. Easter 2024"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caption / Description</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed caption for the gallery..."
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
