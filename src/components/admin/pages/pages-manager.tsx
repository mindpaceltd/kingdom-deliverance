'use client'

import * as React from 'react'
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { DataTable, type ColumnDef } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { createPage, deletePage, updatePage } from '@/lib/actions/pages'
import type { CmsPage } from '@/lib/types'

interface PagesManagerProps {
  initialPages: CmsPage[]
}

interface PageFormProps {
  page?: CmsPage
  onCancel: () => void
  onSuccess: () => void
}

const DEFAULT_JSON = '{\n  "sections": []\n}'

function PageForm({ page, onCancel, onSuccess }: PageFormProps) {
  const [title, setTitle] = React.useState(page?.title ?? '')
  const [slug, setSlug] = React.useState(page?.slug ?? '')
  const [status, setStatus] = React.useState<'draft' | 'published'>(page?.status ?? 'draft')
  const [jsonText, setJsonText] = React.useState(
    page ? JSON.stringify(page.content_json, null, 2) : DEFAULT_JSON
  )
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>
    } catch {
      setError('content_json must be valid JSON.')
      setIsSaving(false)
      return
    }

    const payload = { title, slug, status, content_json: parsed }
    const result = page ? await updatePage(page.id, payload) : await createPage(payload)
    if ('error' in result) {
      setError(result.error)
      setIsSaving(false)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="page-title">Title</Label>
        <Input id="page-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="page-slug">Slug</Label>
        <Input id="page-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="page-status">Status</Label>
        <select
          id="page-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="page-json">Content JSON</Label>
        <Textarea
          id="page-json"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="min-h-[260px] font-mono text-xs"
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : page ? 'Save Changes' : 'Create Page'}
        </Button>
      </div>
    </form>
  )
}

export function PagesManager({ initialPages }: PagesManagerProps) {
  const [pages, setPages] = React.useState<CmsPage[]>(initialPages)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingPage, setEditingPage] = React.useState<CmsPage | null>(null)

  const refreshPages = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('pages').select('*').order('updated_at', { ascending: false })
    if (data) setPages(data as CmsPage[])
  }, [])

  function openNew() {
    setEditingPage(null)
    setSheetOpen(true)
  }

  function openEdit(page: CmsPage) {
    setEditingPage(page)
    setSheetOpen(true)
  }

  async function handleDelete(page: CmsPage) {
    if (!window.confirm(`Delete "${page.title}"?`)) return
    const result = await deletePage(page.id)
    if (!('error' in result)) await refreshPages()
  }

  const columns: ColumnDef<CmsPage>[] = [
    {
      key: 'title',
      header: 'Title',
      cell: (page) => (
        <button
          type="button"
          onClick={() => openEdit(page)}
          className="text-left text-sm font-medium hover:underline"
        >
          {page.title}
        </button>
      ),
    },
    { key: 'slug', header: 'Slug', cell: (page) => <span className="text-sm text-muted-foreground">/{page.slug}</span> },
    { key: 'status', header: 'Status', cell: (page) => <StatusBadge status={page.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'w-[90px]',
      cell: (page) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(page)}>
            <PencilIcon className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => handleDelete(page)}>
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pages</h1>
          <p className="text-sm text-muted-foreground">Manage structured page content JSON.</p>
        </div>
        <Button onClick={openNew} size="sm">
          <PlusIcon />
          New Page
        </Button>
      </div>

      <DataTable columns={columns} data={pages} searchPlaceholder="Search pages..." />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingPage ? 'Edit Page' : 'New Page'}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <PageForm
              page={editingPage ?? undefined}
              onCancel={() => setSheetOpen(false)}
              onSuccess={async () => {
                setSheetOpen(false)
                await refreshPages()
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
