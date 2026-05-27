'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusIcon, PencilIcon, RefreshCw, FileStack, Radar, XIcon, Users } from 'lucide-react'
import { getSeoScoreColor } from '@/lib/posts-helpers'
import { computePageSeoScore } from '@/lib/cms/page-seo-score'
import { submitGoogleIndexing } from '@/lib/seo/submit-google-indexing-client'
import {
  collectIndexablePageUrls,
  getPageIndexUrl,
  isPageIndexable,
} from '@/lib/cms/page-indexing'
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
import { formatAdminDate } from '@/lib/format-admin-date'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PagesManagerProps {
  initialPages: CmsPage[]
  visitorsByPath?: Record<string, number>
  analyticsConnected?: boolean
}

function SeoScoreBadge({ score }: { score: number }) {
  const color = getSeoScoreColor(score)
  const colorClass = {
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  }[color]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        colorClass
      )}
      aria-label={`SEO score: ${score}`}
    >
      {score}
    </span>
  )
}

function reportIndexingResult(result: Awaited<ReturnType<typeof submitGoogleIndexing>>) {
  if (!result.ok) {
    if (result.needsReauth) {
      toast.error(result.message, {
        description: result.hint,
        action: {
          label: 'Reconnect Google',
          onClick: () => {
            window.location.href = '/api/google/auth?reconnect=1'
          },
        },
        duration: 12000,
      })
    } else {
      toast.error(result.message, { description: result.hint })
    }
    return false
  }
  toast.success(result.message)
  return true
}

export function PagesManager({
  initialPages,
  visitorsByPath = {},
  analyticsConnected = false,
}: PagesManagerProps) {
  const router = useRouter()
  const [pages, setPages] = React.useState(initialPages)
  const [search, setSearch] = React.useState('')
  const [filter, setFilter] = React.useState<'all' | 'system' | 'custom'>('all')
  const [syncing, setSyncing] = React.useState(false)
  const [indexingId, setIndexingId] = React.useState<string | null>(null)
  const [bulkIndexing, setBulkIndexing] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    setPages(initialPages)
  }, [initialPages])

  const filtered = React.useMemo(
    () =>
      pages.filter((page) => {
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
      }),
    [pages, filter, search]
  )

  const indexableInFilter = React.useMemo(
    () => filtered.filter(isPageIndexable),
    [filtered]
  )

  async function submitPageUrls(urls: string[]) {
    if (urls.length === 0) {
      toast.error('No published pages to index (draft or noindex pages are skipped).')
      return
    }
    const result = await submitGoogleIndexing(urls)
    reportIndexingResult(result)
  }

  async function handleIndexPage(page: CmsPage) {
    if (!isPageIndexable(page)) {
      toast.error('Only published pages that are not set to noindex can be submitted.')
      return
    }
    setIndexingId(page.id)
    await submitPageUrls([getPageIndexUrl(page)])
    setIndexingId(null)
  }

  async function handleBulkIndex() {
    const selected = pages.filter((p) => selectedIds.has(p.id))
    const urls = collectIndexablePageUrls(selected)
    if (urls.length === 0) {
      toast.error('Selected pages include no published, indexable URLs.')
      return
    }
    setBulkIndexing(true)
    await submitPageUrls(urls)
    setBulkIndexing(false)
    setSelectedIds(new Set())
  }

  async function handleIndexAllPublished() {
    const urls = collectIndexablePageUrls(filtered)
    if (urls.length === 0) {
      toast.error('No published pages in the current list to index.')
      return
    }
    if (
      !window.confirm(
        `Submit ${urls.length} published page URL(s) to Google for indexing?`
      )
    ) {
      return
    }
    setBulkIndexing(true)
    await submitPageUrls(urls)
    setBulkIndexing(false)
  }

  function handleSelectAllIndexable() {
    const ids = new Set(indexableInFilter.map((p) => p.id))
    setSelectedIds(ids)
    if (ids.size === 0) {
      toast.message('No indexable pages in the current list.')
    }
  }

  async function handleSyncSystemPages() {
    setSyncing(true)
    const result = await ensureSystemPages({ overwrite: true })
    setSyncing(false)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success(`Synced ${result.synced} system page(s)`)
    router.refresh()
  }

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
      key: 'visitors',
      header: 'Visitors (28d)',
      cell: (p) => {
        const path = pagePathFromSlug(p.slug === 'home' ? '' : p.slug)
        const views = visitorsByPath[path]
        if (!analyticsConnected) {
          return (
            <span className="text-xs text-muted-foreground" title="Connect Google Analytics in Admin → Analytics">
              —
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums text-foreground">
            <Users className="size-3.5 text-muted-foreground" />
            {(views ?? 0).toLocaleString('en-US')}
          </span>
        )
      },
    },
    {
      key: 'seo',
      header: 'SEO',
      cell: (p) => <SeoScoreBadge score={computePageSeoScore(p)} />,
    },
    {
      key: 'updated',
      header: 'Last updated',
      cell: (p) => (
        <span className="text-sm text-muted-foreground" suppressHydrationWarning>
          {formatAdminDate(p.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[100px]',
      cell: (p) => {
        const canIndex = isPageIndexable(p)
        return (
          <div className="flex items-center justify-end gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Submit to Google for indexing"
              disabled={!canIndex || indexingId === p.id || bulkIndexing}
              onClick={() => void handleIndexPage(p)}
            >
              <Radar
                className={`size-3.5 ${indexingId === p.id ? 'animate-pulse text-primary' : ''}`}
              />
            </Button>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href={`/admin/pages/${p.id}`}>
                <PencilIcon className="size-3.5" />
              </Link>
            </Button>
          </div>
        )
      },
    },
  ]

  const systemCount = pages.filter((p) => parsePageContent(p.content_json).isSystem).length
  const customCount = pages.length - systemCount
  const bulkBusy = bulkIndexing || indexingId !== null

  return (
    <div className="space-y-6 p-6 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileStack className="size-7 text-primary" />
            Pages
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Manage heroes, full SEO, sized images, and Google indexing for every public page.
            Front-end rendering from CMS is still being connected.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bulkBusy || indexableInFilter.length === 0}
            onClick={() => void handleIndexAllPublished()}
          >
            <Radar className={`mr-2 size-4 ${bulkIndexing ? 'animate-pulse' : ''}`} />
            Index all published ({indexableInFilter.length})
          </Button>
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
        <div className="flex flex-wrap items-center gap-2">
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={handleSelectAllIndexable}
            disabled={indexableInFilter.length === 0}
          >
            Select all indexable
          </Button>
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
        rowSelection={{
          getRowId: (p) => p.id,
          selectedIds,
          onSelectionChange: setSelectedIds,
          isRowDisabled: (p) => !isPageIndexable(p),
        }}
      />

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary text-primary-foreground shadow-xl"
          >
            <span className="text-sm font-bold border-r border-white/20 pr-3">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 hover:bg-white/10"
              disabled={bulkBusy}
              onClick={() => void handleBulkIndex()}
            >
              <Radar className={`size-3.5 mr-1.5 ${bulkIndexing ? 'animate-pulse' : ''}`} />
              Index on Google
            </Button>
            <button
              type="button"
              className="p-1 rounded-full hover:bg-white/10"
              aria-label="Clear selection"
              onClick={() => setSelectedIds(new Set())}
            >
              <XIcon className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
