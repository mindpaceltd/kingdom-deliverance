'use client'

import * as React from 'react'
import { PlusIcon, SearchIcon, PencilIcon, Trash2Icon, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createSermonSeries, updateSermonSeries, deleteSermonSeries } from '@/lib/actions/sermon-series'
import type { SermonSeries } from '@/lib/types'
import { generateSlug } from '@/lib/utils'

interface SeriesManagerProps {
  initialSeries: SermonSeries[]
}

export function SeriesManager({ initialSeries }: SeriesManagerProps) {
  const [seriesList, setSeriesList] = React.useState<SermonSeries[]>(initialSeries)
  const [search, setSearch] = React.useState('')
  const [isEditing, setIsEditing] = React.useState(false)
  const [currentSeries, setCurrentSeries] = React.useState<Partial<SermonSeries>>({})
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const filteredSeries = seriesList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setIsEditing(false)
    setCurrentSeries({ name: '', slug: '', description: '' })
    setIsDialogOpen(true)
  }

  function openEdit(series: SermonSeries) {
    setIsEditing(true)
    setCurrentSeries(series)
    setIsDialogOpen(true)
  }

  async function handleSave() {
    if (!currentSeries.name?.trim()) return
    
    setLoading(true)
    const data = {
      name: currentSeries.name.trim(),
      slug: currentSeries.slug?.trim() || generateSlug(currentSeries.name),
      description: currentSeries.description?.trim() || null,
      image_url: currentSeries.image_url || null,
    }

    let result
    if (isEditing && currentSeries.id) {
      result = await updateSermonSeries(currentSeries.id, data)
    } else {
      result = await createSermonSeries(data)
    }

    setLoading(false)
    if ('success' in result) {
      setIsDialogOpen(false)
      // Optimistic or just re-fetch? Let's reload the page to refresh server data
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this series?')) return
    
    const result = await deleteSermonSeries(id)
    if ('success' in result) {
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sermon Series</h1>
          <p className="text-muted-foreground">Manage your sermon collections and series.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          New Series
        </Button>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search series..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSeries.map((s) => (
          <div
            key={s.id}
            className="group relative flex flex-col rounded-lg border bg-card p-5 hover:border-primary/50 transition-colors shadow-sm"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{s.name}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-1">/{s.slug}</p>
              {s.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {s.description}
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(s)}
                className="flex-1 gap-1.5"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(s.id)}
                className="flex-1 gap-1.5 text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                <Trash2Icon className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredSeries.length === 0 && (
        <div className="py-12 text-center border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No sermon series found.</p>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Series' : 'Create New Series'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="series-name">Name</Label>
              <Input
                id="series-name"
                value={currentSeries.name || ''}
                onChange={(e) => setCurrentSeries({ ...currentSeries, name: e.target.value })}
                placeholder="e.g. Faith Series"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="series-slug">Slug</Label>
              <Input
                id="series-slug"
                value={currentSeries.slug || ''}
                onChange={(e) => setCurrentSeries({ ...currentSeries, slug: e.target.value })}
                placeholder="e.g. faith-series"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="series-desc">Description (optional)</Label>
              <Textarea
                id="series-desc"
                value={currentSeries.description || ''}
                onChange={(e) => setCurrentSeries({ ...currentSeries, description: e.target.value })}
                placeholder="What is this series about?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !currentSeries.name}>
              {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Series'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
