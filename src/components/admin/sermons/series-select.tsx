'use client'

import * as React from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSermonSeries } from '@/lib/actions/sermon-series'
import type { SermonSeries } from '@/lib/types'

interface SeriesSelectProps {
  value: string | null
  allSeries: SermonSeries[]
  onChange: (id: string | null) => void
  disabled?: boolean
}

export function SeriesSelect({ value, allSeries, onChange, disabled }: SeriesSelectProps) {
  const [showCreate, setShowCreate] = React.useState(false)
  const [newName, setNewName] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setCreateError(null)
    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const result = await createSermonSeries({
      name: newName.trim(),
      slug,
      description: null,
      image_url: null,
      meta_title: null,
      meta_description: null,
      focus_keyword: null,
      seo_score: 0,
    })
    setCreating(false)
    if ('success' in result) {
      onChange(result.id)
      setNewName('')
      setShowCreate(false)
      window.location.reload()
    } else {
      setCreateError(result.error)
    }
  }

  return (
    <div className="space-y-2">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <option value="">None / Individual Sermon</option>
        {allSeries.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {!showCreate ? (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <PlusIcon className="size-3" /> Create new series
        </button>
      ) : (
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Series name"
            className="h-8 text-sm flex-1"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={creating || !newName.trim()}>
            {creating ? '…' : 'Add'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setShowCreate(false); setNewName('') }}>
            Cancel
          </Button>
        </form>
      )}
      {createError && <p className="text-xs text-destructive">{createError}</p>}
    </div>
  )
}
