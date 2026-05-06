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
import { motion, AnimatePresence } from 'framer-motion'

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
    <div className="space-y-8 p-6 pb-20">
      {/* Page Header & Stats Summary */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-black tracking-tight text-primary">Content <span className="text-accent">Library</span></h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your blog posts, news, and prophetic articles.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button 
              onClick={() => router.push('/admin/posts/new')} 
              size="lg"
              className="rounded-full shadow-lg hover:shadow-accent/20 transition-all hover:scale-105 active:scale-95"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Create New Post
            </Button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Posts', value: posts.length, icon: FileTextIcon, color: 'text-blue-500' },
            { label: 'Published', value: posts.filter(p => p.status === 'published').length, icon: CheckCircle2Icon, color: 'text-green-500' },
            { label: 'Scheduled', value: posts.filter(p => p.status === 'scheduled').length, icon: ClockIcon, color: 'text-purple-500' },
            { label: 'Avg SEO Score', value: Math.round(posts.reduce((acc, p) => acc + (p.seo_score || 0), 0) / (posts.length || 1)), icon: BarChartIcon, color: 'text-accent' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm flex items-center gap-4 hover:border-accent/30 transition-colors group"
            >
              <div className={cn("p-3 rounded-xl bg-muted group-hover:scale-110 transition-transform", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-bold tabular-nums">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Filter tabs */}
        <div className="flex items-center justify-between border-b pb-px overflow-x-auto scrollbar-hide">
          <div
            role="tablist"
            className="flex gap-2"
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
                    'relative px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap',
                    activeFilter === tab.key
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                      activeFilter === tab.key ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  )}
                  {activeFilter === tab.key && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bulk Actions Floating Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-full bg-primary text-primary-foreground shadow-2xl backdrop-blur-md border border-white/10"
            >
              <span className="text-sm font-bold border-r border-white/20 pr-4">
                {selectedIds.size} SELECTED
              </span>
              <div className="flex items-center gap-2">
                {!isTrashFilter ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkTrash}
                    disabled={actionLoading === 'bulk'}
                    className="h-8 text-red-400 hover:text-red-300 hover:bg-white/10"
                  >
                    <Trash2Icon className="mr-2 h-3.5 w-3.5" />
                    Move to Trash
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBulkRestore}
                      disabled={actionLoading === 'bulk'}
                      className="h-8 hover:bg-white/10"
                    >
                      <RotateCcwIcon className="mr-2 h-3.5 w-3.5" />
                      Restore
                    </Button>
                    {role === 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBulkPermanentDelete}
                        disabled={actionLoading === 'bulk'}
                        className="h-8 text-red-400 hover:text-red-300 hover:bg-white/10"
                      >
                        <XIcon className="mr-2 h-3.5 w-3.5" />
                        Delete Permanently
                      </Button>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List Content */}
        {filteredPosts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-32 rounded-3xl border border-dashed bg-muted/20"
          >
            <div className="p-6 rounded-full bg-muted/50">
              <FileTextIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground">{EMPTY_STATE_MESSAGES[activeFilter]}</p>
              <p className="text-sm text-muted-foreground/60">Try changing your filter or create something new.</p>
            </div>
            {activeFilter === 'all' && (
              <Button
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => router.push('/admin/posts/new')}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Create First Post
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* List Header (Hidden on mobile) */}
            <div className="hidden md:grid grid-cols-[40px_1fr_120px_140px_100px_180px] gap-4 px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-transparent">
              <div className="flex justify-center">
                <Checkbox
                  checked={allPageSelected}
                  indeterminate={somePageSelected}
                  onChange={toggleSelectAll}
                />
              </div>
              <div>Details</div>
              <div className="text-center">Category</div>
              <div className="text-center">Status</div>
              <div className="text-center">SEO</div>
              <div className="text-right">Actions</div>
            </div>

            {/* List Body */}
            <div className="space-y-3">
              {pagedPosts.map((post, index) => {
                const isTrash = post.status === 'trash'
                const isSelected = selectedIds.has(post.id)
                const loading = actionLoading === `trash-${post.id}` || actionLoading === `dup-${post.id}`

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "grid grid-cols-1 md:grid-cols-[40px_1fr_120px_140px_100px_180px] gap-4 px-4 md:px-6 py-4 rounded-2xl border transition-all duration-300 group",
                      isSelected 
                        ? "bg-accent/[0.03] border-accent/30 shadow-md shadow-accent/5" 
                        : "bg-card hover:bg-muted/50 hover:border-accent/20 hover:shadow-lg hover:shadow-black/5"
                    )}
                  >
                    {/* Checkbox */}
                    <div className="hidden md:flex items-center justify-center">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectRow(post.id)}
                      />
                    </div>

                    {/* Post Main Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-white/5 relative group/img">
                        {post.featured_image ? (
                          <img src={post.featured_image} alt="" className="h-full w-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <EyeIcon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <button
                          onClick={() => router.push(`/admin/posts/${post.id}`)}
                          className="font-bold text-primary hover:text-accent transition-colors truncate block text-left w-full"
                        >
                          {post.title}
                        </button>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User2Icon className="h-3 w-3" />
                            {post.profiles?.name || 'Unknown'}
                          </span>
                          <span className="text-muted-foreground/30">•</span>
                          <span>{formatDate(post.updated_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Category/Type */}
                    <div className="hidden md:flex items-center justify-center">
                      <Badge variant="outline" className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                        post.type === 'blog' ? "text-purple-500 border-purple-500/20 bg-purple-500/5" : "text-blue-500 border-blue-500/20 bg-blue-500/5"
                      )}>
                        {post.type}
                      </Badge>
                    </div>

                    {/* Status */}
                    <div className="hidden md:flex items-center justify-center">
                      <StatusBadge status={post.status} className="shadow-sm" />
                    </div>

                    {/* SEO Score */}
                    <div className="hidden md:flex items-center justify-center">
                      <div className="relative h-10 w-10 flex items-center justify-center">
                        <svg className="h-full w-full -rotate-90">
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-muted"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={100}
                            strokeDashoffset={100 - (post.seo_score || 0)}
                            className={cn(
                              (post.seo_score || 0) > 80 ? "text-green-500" : (post.seo_score || 0) > 50 ? "text-yellow-500" : "text-red-500"
                            )}
                          />
                        </svg>
                        <span className="absolute text-[10px] font-black tabular-nums">{post.seo_score || 0}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      {!isTrash ? (
                        <>
                          <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/admin/posts/${post.id}`)} title="Edit">
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                          {post.status === 'published' && (
                            <Button variant="ghost" size="icon-sm" onClick={() => window.open(`/blog/${post.slug}`, '_blank')} title="View Live">
                              <ExternalLinkIcon className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDuplicate(post)} title="Duplicate">
                            <CopyIcon className="h-3.5 w-3.5" />
                          </Button>
                          {canModify(post) && (
                            <Button variant="ghost" size="icon-sm" onClick={() => handleTrash(post)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Trash">
                              <Trash2Icon className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleRestore(post)} title="Restore">
                            <RotateCcwIcon className="h-3.5 w-3.5" />
                          </Button>
                          {role === 'admin' && (
                            <Button variant="ghost" size="icon-sm" onClick={() => handlePermanentDelete(post)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Delete Forever">
                              <XIcon className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            {filteredPosts.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-8 border-t border-transparent">
                <p className="text-sm text-muted-foreground font-medium">
                  Showing <span className="text-primary">{pageStart + 1}</span> to <span className="text-primary">{pageEnd}</span> of <span className="text-primary font-bold">{filteredPosts.length}</span> articles
                </p>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="rounded-full"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={cn(
                          "h-8 w-8 rounded-full text-xs font-bold transition-all",
                          safePage === i + 1 ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="rounded-full"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FileTextIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
  )
}

function CheckCircle2Icon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
  )
}

function ClockIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )
}

function BarChartIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
  )
}

function ImageIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
  )
}

function EyeIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  )
}

function User2Icon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )
}

function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'outline' | 'secondary' | 'destructive', className?: string }) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border text-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  }
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant], className)}>
      {children}
    </span>
  )
}
