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

import { DataTable, type ColumnDef } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
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
}

export function PostsManager({ initialPosts }: PostsManagerProps) {
  const { role, profile } = useAdmin()
  const router = useRouter()
  const [posts, setPosts] = React.useState<Post[]>(initialPosts)
  const [activeFilter, setActiveFilter] = React.useState<PostStatusFilter>('all')
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  // Re-fetch posts from Supabase using the browser client
  const refreshPosts = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(name, avatar_url)')
      .order('updated_at', { ascending: false })
    if (data) setPosts(data as Post[])
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
  // Filtered data
  // ---------------------------------------------------------------------------

  const filteredPosts = filterPostsByStatus(posts, activeFilter)

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------

  const columns: ColumnDef<Post>[] = [
    {
      key: 'title',
      header: 'Title',
      className: 'max-w-[240px]',
      cell: (post) => (
        <button
          type="button"
          onClick={() => router.push(`/admin/posts/${post.id}`)}
          className="truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline max-w-[220px] block"
          title={post.title}
        >
          {post.title}
        </button>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (post) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            post.type === 'blog'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
          }`}
        >
          {post.type === 'blog' ? 'Blog' : 'News'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (post) => <StatusBadge status={post.status} />,
    },
    {
      key: 'seo_score',
      header: 'SEO',
      cell: (post) => <SeoScoreBadge score={post.seo_score ?? 0} />,
    },
    {
      key: 'author',
      header: 'Author',
      cell: (post) => (
        <span className="text-sm text-muted-foreground">
          {post.profiles?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'updated_at',
      header: 'Date',
      cell: (post) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(post.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[140px]',
      cell: (post) => {
        const isTrash = post.status === 'trash'
        const loading = actionLoading

        return (
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
        )
      },
    },
  ]

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
              onClick={() => setActiveFilter(tab.key)}
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
        <DataTable
          columns={columns}
          data={filteredPosts}
          searchPlaceholder="Search posts…"
        />
      )}
    </div>
  )
}
