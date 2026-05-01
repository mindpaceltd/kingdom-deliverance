'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  FileText,
  Music,
  Video,
  File,
  Trash2,
  Upload,
  X,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
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
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { deleteMedia, updateMedia } from '@/lib/actions/media'
import { createClient } from '@/lib/supabase/client'
import type { MediaAsset } from '@/lib/types'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterType = 'all' | 'image' | 'audio' | 'video' | 'document'

interface MediaLibraryProps {
  initialMedia: MediaAsset[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function TypeIcon({ type, className }: { type: MediaAsset['type']; className?: string }) {
  switch (type) {
    case 'audio':
      return <Music className={cn("size-10 text-muted-foreground", className)} />
    case 'video':
      return <Video className={cn("size-10 text-muted-foreground", className)} />
    case 'document':
      return <FileText className={cn("size-10 text-muted-foreground", className)} />
    default:
      return <File className={cn("size-10 text-muted-foreground", className)} />
  }
}

// ---------------------------------------------------------------------------
// MediaLibrary (main Client Component)
// ---------------------------------------------------------------------------

export function MediaLibrary({ initialMedia }: MediaLibraryProps) {
  const [media, setMedia] = React.useState<MediaAsset[]>(initialMedia)
  const [activeFilter, setActiveFilter] = React.useState<FilterType>('all')
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [selectedAsset, setSelectedAsset] = React.useState<MediaAsset | null>(null)
  
  // Edit state for the sidebar
  const [editForm, setEditForm] = React.useState({
    filename: '',
    alt_text: '',
    caption: '',
  })
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Sync edit form when selection changes
  React.useEffect(() => {
    if (selectedAsset) {
      setEditForm({
        filename: selectedAsset.filename || '',
        alt_text: selectedAsset.alt_text || '',
        caption: selectedAsset.caption || '',
      })
      setCopied(false)
    }
  }, [selectedAsset])

  const refreshMedia = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setMedia(data as MediaAsset[])
  }, [])

  async function handleSaveMetadata() {
    if (!selectedAsset) return
    setSaving(true)
    const result = await updateMedia(selectedAsset.id, editForm)
    setSaving(false)
    if ('success' in result) {
      setMedia(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, ...editForm } : a))
      setSelectedAsset(prev => prev ? { ...prev, ...editForm } : null)
    } else {
      alert(result.error)
    }
  }

  async function handleDelete() {
    if (!selectedAsset || !window.confirm('Are you sure you want to delete this media?')) return
    setDeleting(true)
    const result = await deleteMedia(selectedAsset.id)
    setDeleting(false)
    if ('success' in result) {
      setMedia(prev => prev.filter(a => a.id !== selectedAsset.id))
      setSelectedAsset(null)
    } else {
      alert(result.error)
    }
  }

  function copyUrl() {
    if (!selectedAsset) return
    navigator.clipboard.writeText(selectedAsset.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = activeFilter === 'all' ? media : media.filter((a) => a.type === activeFilter)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your images, videos, and documents.</p>
        </div>
        <Button
          variant={uploadOpen ? 'outline' : 'default'}
          size="sm"
          onClick={() => setUploadOpen((v) => !v)}
        >
          {uploadOpen ? <X className="mr-2 size-4" /> : <Upload className="mr-2 size-4" />}
          {uploadOpen ? 'Close' : 'Add New'}
        </Button>
      </div>

      {/* Upload zone */}
      {uploadOpen && (
        <UploadZone
          onUploadComplete={() => { refreshMedia(); setUploadOpen(false); }}
          className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 transition-colors hover:bg-muted/30"
        />
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {['all', 'image', 'audio', 'video', 'document'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter as FilterType)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px capitalize",
              activeFilter === filter ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Media grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => setSelectedAsset(asset)}
            className={cn(
              "group relative flex flex-col aspect-square overflow-hidden rounded-lg border-2 bg-muted transition-all hover:ring-2 hover:ring-primary/20",
              selectedAsset?.id === asset.id ? "border-primary ring-2 ring-primary/20" : "border-transparent"
            )}
          >
            {asset.type === 'image' ? (
              <Image
                src={asset.url}
                alt={asset.alt_text ?? asset.filename}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 20vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <TypeIcon type={asset.type} className="size-8 opacity-40" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
               <span className="text-[10px] font-medium text-white px-2 py-1 bg-black/60 rounded-full">Select</span>
            </div>
          </button>
        ))}
      </div>

      {/* WordPress-style details sheet */}
      <Sheet open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto px-0">
          <SheetHeader className="px-6 pb-4 border-b border-border">
            <SheetTitle>Attachment Details</SheetTitle>
          </SheetHeader>

          {selectedAsset && (
            <div className="flex flex-col">
              {/* Preview Area */}
              <div className="p-6 bg-muted/30 flex items-center justify-center min-h-[240px] border-b border-border">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border shadow-sm bg-white">
                  {selectedAsset.type === 'image' ? (
                    <Image
                      src={selectedAsset.url}
                      alt={selectedAsset.alt_text ?? selectedAsset.filename}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <TypeIcon type={selectedAsset.type} className="size-16" />
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata area */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-xs">
                   <div>
                     <p className="text-muted-foreground">Type</p>
                     <p className="font-medium uppercase">{selectedAsset.mime_type?.split('/')[1] || selectedAsset.type}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">File Size</p>
                     <p className="font-medium">{formatBytes(selectedAsset.size_bytes)}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">Uploaded On</p>
                     <p className="font-medium">{new Date(selectedAsset.created_at).toLocaleDateString()}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">ID</p>
                     <p className="font-medium truncate" title={selectedAsset.id}>...{selectedAsset.id.slice(-8)}</p>
                   </div>
                </div>

                <div className="pt-2">
                   <Button variant="outline" size="sm" className="w-full h-8 gap-2" onClick={copyUrl}>
                      {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
                      {copied ? 'Copied' : 'Copy Public URL'}
                   </Button>
                </div>

                <div className="border-t border-border pt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alt Text (Alternative Text)</Label>
                    <Input
                      value={editForm.alt_text}
                      onChange={(e) => setEditForm(prev => ({ ...prev, alt_text: e.target.value }))}
                      placeholder="Describe the image for SEO..."
                    />
                    <p className="text-[10px] text-muted-foreground italic">Important for accessibility and SEO ranking.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title / Filename</Label>
                    <Input
                      value={editForm.filename}
                      onChange={(e) => setEditForm(prev => ({ ...prev, filename: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caption</Label>
                    <Textarea
                      value={editForm.caption}
                      onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-background p-6 border-t border-border flex items-center justify-between gap-3">
                 <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                   {deleting ? 'Deleting...' : <><Trash2 className="mr-2 size-4" /> Delete Permanently</>}
                 </Button>
                 <Button size="sm" onClick={handleSaveMetadata} disabled={saving}>
                   {saving ? 'Saving...' : 'Save Changes'}
                 </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
