'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PlusIcon, PencilIcon, RefreshCw, FileStack } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/admin/status-badge'
import { DataTable, type ColumnDef } from '@/components/admin/data-table'
import { ensureSystemPages } from '@/lib/actions/pages'
import {
  pagePathFromSlug,
  pageTypeLabel,
  parsePageContent,
} from '@/lib/cms/page-content'
import type { CmsPage } from '@/lib/types'
import { toast } from 'sonner'

interface PagesManagerProps {
  initialPages: CmsPage[]
}

export function PagesManager({ initialPages }: PagesManagerProps) {
  const router = useRouter()
  const [pages, setPages] = React.useState(initialPages)
  const [search, setSearch] = React.useState('')
  const [filter, setFilter] = React.useState<'all' | 'system' | 'custom'>('all')
  const [syncing, setSyncing] = React.useState(false)

  React.useEffect(() => {
    setPages(initialPages)
  }, [initialPages])

  async function handleSyncSystemPages() {
    setSyncing(true)
    const result = await ensureSystemPages()
    setSyncing(false)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success(`Synced ${result.synced} system page(s)`)
    router.refresh()
  }

  const filtered = pages.filter((page) => {
    const content = parsePageContent(page.content_json)
    if (filter === 'system' && !content.isSystem) return false
    if (filter === 'custom' && content.isSystem) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      page.title.toLowerCase().includes(q) ||
      page.slug.toLowerCase().includes(q) ||
      pageTypeLabel(content.pageType, content.listingTarget).toLowerCase().includes(q)
    )
  })

  const columns: ColumnDef<CmsPage>[] = [
    {
      key: 'title',
      header: 'Title',
      cell: (p) => {
        const content = parsePageContent(p.content_json)
        return (
          <div>
            <Link
              href={`/admin/pages/${p.id}`}
              className="font-medium text-primary hover:underline"
            >
              {p.title}
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pageTypeLabel(content.pageType, content.listingTarget)}
              {content.isSystem ? ' · System' : ' · Custom'}
            </p>
          </div>
        )
      },
    },
    {
      key: 'path',
      header: 'URL (planned)',
      cell: (p) => (
        <code className="text-xs text-muted-foreground">
          {pagePathFromSlug(p.slug === 'home' ? '' : p.slug)}
        </code>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'updated',
      header: 'Last updated',
      cell: (p) => (
        <span className="text-sm text-muted-foreground">
          {new Date(p.updated_at).toLocaleDateString('en-UG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px]',
      cell: (p) => (
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={`/admin/pages/${p.id}`}>
            <PencilIcon className="size-3.5" />
          </Link>
        </Button>
      ),
    },
  ]

  const systemCount = pages.filter((p) => parsePageContent(p.content_json).isSystem).length
  const customCount = pages.length - systemCount

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileStack className="size-7 text-primary" />
            Pages
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            WordPress-style page manager for your public site. Edit heroes, body copy, and SEO
            here first — front-end display will be connected in a later step.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={syncing}
            onClick={() => void handleSyncSystemPages()}
          >
            <RefreshCw className={`mr-2 size-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync system pages
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/pages/new">
              <PlusIcon className="mr-2 size-4" />
              Add page
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">All pages</p>
          <p className="text-2xl font-bold">{pages.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">System pages</p>
          <p className="text-2xl font-bold">{systemCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Custom pages</p>
          <p className="text-2xl font-bold">{customCount}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border p-1 bg-muted/30">
          {(['all', 'system', 'custom'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Input
          placeholder="Search pages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        hideSearch
        pageSize={15}
        searchPlaceholder=""
      />
    </div>
  )
}
