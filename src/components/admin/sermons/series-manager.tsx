'use client'

import * as React from 'react'
import { PlusIcon, SearchIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteSermonSeries } from '@/lib/actions/sermon-series'
import type { SermonSeries } from '@/lib/types'

interface SeriesManagerProps {
  initialSeries: SermonSeries[]
}

export function SeriesManager({ initialSeries }: SeriesManagerProps) {
  const router = useRouter()
  const [seriesList, setSeriesList] = React.useState<SermonSeries[]>(initialSeries)
  const [search, setSearch] = React.useState('')

  const filteredSeries = seriesList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    router.push('/admin/sermons/series/new')
  }

  function openEdit(series: SermonSeries) {
    router.push(`/admin/sermons/series/${series.id}`)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this series?')) return
    const result = await deleteSermonSeries(id)
    if ('success' in result) {
      setSeriesList(prev => prev.filter(s => s.id !== id))
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
    </div>
  )
}
