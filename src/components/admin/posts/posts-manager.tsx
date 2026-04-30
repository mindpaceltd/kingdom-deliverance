'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  CopyIcon,
  RotateCcwIcon,
  ExternalLinkIcon,
  XIcon,
} from 'lucide-react'

import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdmin } from '@/lib/admin-context'
import {
  duplicatePost,
  trashPost,
  restorePost,
  permanentDeletePost,
} from '@/lib/actions/posts'
import { createClient } from '@/lib/supabase/client'
import { getSeoScoreColor, filterPostsByStatus, type PostStatusFilter } from '@/lib/posts-helpers'
import { cn } from '@/lib/utils'
import type { Post } from '@/lib/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
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

// ---------------------------------------------------------------------------
// Filter tabs config
// ---------------------------------------------------------------------------

const FILTER_TABS: { key: PostStatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'trash', label: 'Trash' },
]

const EMPTY_STATE_MESSAGES: Record<PostStatusFilter, string> = {
  all: 'No posts yet. Create your first post.',
  published: 'No published posts.',
  draft: 'No drafts.',
  scheduled: 'No scheduled posts.',
  trash: 'Trash is empty.',
  archived: 'No archived posts.',
}

// ---------------------------------------------------------------------------
// PostsManager
// ---------------------------------------------------------------------------

interface PostsManagerProps {
  initialPosts: Post[]
  /** Optional initial filter tab to activate on mount */
  initialFilter?: string
}

export function PostsManager({ initialPosts, initialFilter }: PostsManagerProps) {
  const { role, profile } = useAdmin()
  const router = useRouter()
  const [posts, setPosts] = React.useState<Post[]>(initialPosts)

  // Resolve the initial filter — fall back to 'all' if the provided value is
  // not a recognised filter key.
  const resolvedInitialFilter: PostStatusFilter = React.useMemo(() => {
    const validKeys = FILTER_TABS.map((t) => t.key)
    return validKeys.includes(initialFilter as PostStatusFilter)
      ? (initialFilter as PostStatusFilter)
      : 'all'
  }, [initialFilter])

  const [activeFilter, setActiveFilter] = React.useState<PostStatusFilter>(resolvedInitialFilter)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1)

  // Selection state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  // Re-fetch posts from Supabase using the browser client
  const refreshPosts = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(name, avatar_url)')
      .order('updated_at', { ascending: false })
    if (data) setPosts(data as Post[])
  }, [])

  // Reset page and selection whenever the active filter changes
  const handleFilterChange = React.useCallback((filter: PostStatusFilter) => {
    setActiveFilter(filter)
    setCurrentPage(1)
    setSelectedIds(new Set())
  }, [])

  // Determine whether the current user can trash/delete a given post
  function canModify(post: Post): boolean {
    if (role === 'admin') return true
    if (role === 'editor' || role === 'author') {
      return post.author_id === profile.id
    }
    return false
  }

  // ---------------------------------------------------------------------------
  // Row actions
  // ---------------------------------------------------------------------------

  async function handleDuplicate(post: Post) {
    setActionLoading(`dup-${post.id}`)
    await duplicatePost(post.id)
    await refreshPosts()
    setActionLoading(null)
  }

  async function handleTrash(post: Post) {
    if (!window.confirm(`Move "${post.title}" to trash?`)) return
    setActionLoading(`trash-${post.id}`)
    await trashPost(post.id)
    await refreshPosts()
    setActionLoading(null)
  }

  async function handleRestore(post: Post) {
    setActionLoading(`restore-${post.id}`)
    await restorePost(post.id)
    await refreshPosts()
    setActionLoading(null)
  }

  async function handlePermanentDelete(post: Post) {
    if (
      !window.confirm(
        `Permanently delete "${post.title}"? This cannot be undone.`
      )
    )
      return
    setActionLoading(`perm-${post.id}`)
    await permanentDeletePost(post.id)
    await refreshPosts()
    setActionLoading(null)
  }

  // ---------------------------------------------------------------------------
  // Bulk actions
  // ---------------------------------------------------------------------------

  async function handleBulkTrash() {
    if (
      !window.confirm(
        `Move ${selectedIds.size} post(s) to trash?`
      )
    )
      return
    setActionLoading('bulk')
    for (const id of Array.from(selectedIds)) {
      await trashPost(id)
    }
    await refreshPosts()
    setSelectedIds(new Set())
    setActionLoading(null)
  }

  async function handleBulkRestore() {
    setActionLoading('bulk')
    for (const id of Array.from(selectedIds)) {
      await restorePost(id)
    }
    await refreshPosts()
    setSelectedIds(new Set())
    setActionLoading(null)
  }

  async function handleBulkPermanentDelete() {
    if (
      !window.confirm(
        `Permanently delete ${selectedIds.size} post(s)? This cannot be undone.`
      )
    )
      return
    setActionLoading('bulk')
    for (const id of Array.from(selectedIds)) {
      await permanentDeletePost(id)
    }
    await refreshPosts()
    setSelectedIds(new Set())
    setActionLoading(null)
  }

  // ---------------------------------------------------------------------------
  // Filtered + paginated data
  // ---------------------------------------------------------------------------

  const filteredPosts = filterPostsByStatus(posts, activeFilter)

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filteredPosts.length)
  const pagedPosts = filteredPosts.slice(pageStart, pageEnd)

  // IDs visible on the current page
  const pageIds = pagedPosts.map((p) => p.id)

  // "Select all on current page" checkbox state
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const somePageSelected =
    pageIds.some((id) => selectedIds.has(id)) && !allPageSelected

  function toggleSelectAll() {
    if (allPageSelected) {
      // Deselect all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      // Select all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Determine whether the bulk toolbar should show trash vs restore actions
  const isTrashFilter = activeFilter === 'trash'

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Posts</h1>
          <p className="text-sm text-muted-foreground">
            Manage blog posts and news articles.
          </p>
        </div>
        <Button onClick={() => router.push('/admin/posts/new')} size="sm">
          <PlusIcon />
          New Post
        </Button>
      </div>

      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filter posts by status"
        className="flex gap-1 border-b border-border"
      >
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? posts.length
              : posts.filter((p) => p.status === tab.key).length

          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeFilter === tab.key}
              type="button"
              onClick={() => handleFilterChange(tab.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium transition-colors',
                activeFilter === tab.key
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                    activeFilter === tab.key
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bulk-action toolbar — shown when one or more posts are selected */}
      {selectedIds.size > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-4 py-2"
        >
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>

          {/* Bulk Trash — for non-trash filters */}
          {!isTrashFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkTrash}
              disabled={actionLoading === 'bulk'}
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon className="mr-1.5 size-3.5" />
              Bulk Trash
            </Button>
          )}

          {/* Bulk Restore — for trash filter */}
          {isTrashFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRestore}
              disabled={actionLoading === 'bulk'}
            >
              <RotateCcwIcon className="mr-1.5 size-3.5" />
              Bulk Restore
            </Button>
          )}

          {/* Bulk Delete Permanently — for trash filter, admin only */}
          {isTrashFilter && role === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkPermanentDelete}
              disabled={actionLoading === 'bulk'}
              className="text-destructive hover:text-destructive"
            >
              <XIcon className="mr-1.5 size-3.5" />
              Bulk Delete Permanently
            </Button>
          )}

          {/* Clear selection */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedIds(new Set())}
            aria-label="Clear selection"
            title="Clear selection"
            className="ml-auto"
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Table or empty state */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <p className="text-sm">{EMPTY_STATE_MESSAGES[activeFilter]}</p>
          {activeFilter === 'all' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/admin/posts/new')}
            >
              <PlusIcon />
              Create Post
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Table with manual checkbox header */}
          <div className="rounded-md border">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  {/* Select-all checkbox */}
                  <th className="h-10 w-[40px] px-2 text-left align-middle font-medium text-muted-foreground">
                    <Checkbox
                      checked={allPageSelected}
                      indeterminate={somePageSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all posts on this page"
                    />
                  </th>
                  <th className="h-10 max-w-[240px] px-4 text-left align-middle font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    SEO
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    Author
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="h-10 w-[140px] px-4 text-left align-middle font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {pagedPosts.map((post) => {
                  const isTrash = post.status === 'trash'
                  const loading = actionLoading
                  const isSelected = selectedIds.has(post.id)

                  return (
                    <tr
                      key={post.id}
                      className={cn(
                        'border-b transition-colors hover:bg-muted/50',
                        isSelected && 'bg-muted/30'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="w-[40px] px-2 py-2 align-middle">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleSelectRow(post.id)}
                          aria-label={`Select ${post.title}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>

                      {/* Title */}
                      <td className="max-w-[240px] px-4 py-2 align-middle">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/posts/${post.id}`)}
                          className="truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline max-w-[220px] block"
                          title={post.title}
                        >
                          {post.title}
                        </button>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-2 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            post.type === 'blog'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {post.type === 'blog' ? 'Blog' : 'News'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2 align-middle">
                        <StatusBadge status={post.status} />
                      </td>

                      {/* SEO Score */}
                      <td className="px-4 py-2 align-middle">
                        <SeoScoreBadge score={post.seo_score ?? 0} />
                      </td>

                      {/* Author */}
                      <td className="px-4 py-2 align-middle">
                        <span className="text-sm text-muted-foreground">
                          {post.profiles?.name ?? '—'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-2 align-middle">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(post.updated_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="w-[140px] px-4 py-2 align-middle">
                        <div className="flex items-center gap-0.5">
                          {/* Edit — only for non-trash posts */}
                          {!isTrash && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => router.push(`/admin/posts/${post.id}`)}
                              aria-label={`Edit ${post.title}`}
                              title="Edit"
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                          )}

                          {/* Preview — only for published posts */}
                          {post.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                              aria-label={`Preview ${post.title}`}
                              title="Preview"
                            >
                              <ExternalLinkIcon className="size-3.5" />
                            </Button>
                          )}

                          {/* Duplicate — only for non-trash posts */}
                          {!isTrash && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDuplicate(post)}
                              disabled={loading === `dup-${post.id}`}
                              aria-label={`Duplicate ${post.title}`}
                              title="Duplicate"
                            >
                              <CopyIcon className="size-3.5" />
                            </Button>
                          )}

                          {/* Restore — only for trash posts */}
                          {isTrash && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleRestore(post)}
                              disabled={loading === `restore-${post.id}`}
                              aria-label={`Restore ${post.title}`}
                              title="Restore"
                            >
                              <RotateCcwIcon className="size-3.5" />
                            </Button>
                          )}

                          {/* Trash — only for non-trash posts, if user can modify */}
                          {!isTrash && canModify(post) && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleTrash(post)}
                              disabled={loading === `trash-${post.id}`}
                              aria-label={`Move ${post.title} to trash`}
                              title="Move to Trash"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          )}

                          {/* Permanent delete — only for trash posts, admin only */}
                          {isTrash && role === 'admin' && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handlePermanentDelete(post)}
                              disabled={loading === `perm-${post.id}`}
                              aria-label={`Permanently delete ${post.title}`}
                              title="Delete Permanently"
                              className="text-destructive hover:text-destructive"
                            >
                              <XIcon className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls — shown when there are more than PAGE_SIZE posts */}
          {filteredPosts.length > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>
                Showing {pageStart + 1}–{pageEnd} of {filteredPosts.length} posts
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  Previous
                </Button>
                <span className="tabular-nums">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
