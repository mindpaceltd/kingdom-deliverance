'use client'

import * as React from 'react'
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import { DataTable, type ColumnDef } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAdmin } from '@/lib/admin-context'
import { deletePost } from '@/lib/actions/posts'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/lib/types'
import { PostForm } from './post-form'

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

// ---------------------------------------------------------------------------
// PostsManager
// ---------------------------------------------------------------------------

interface PostsManagerProps {
  initialPosts: Post[]
}

export function PostsManager({ initialPosts }: PostsManagerProps) {
  const { role, profile } = useAdmin()
  const [posts, setPosts] = React.useState<Post[]>(initialPosts)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingPost, setEditingPost] = React.useState<Post | null>(null)

  // Re-fetch posts from Supabase using the browser client
  const refreshPosts = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(name, avatar_url)')
      .order('updated_at', { ascending: false })
    if (data) setPosts(data as Post[])
  }, [])

  function openNew() {
    setEditingPost(null)
    setSheetOpen(true)
  }

  function openEdit(post: Post) {
    setEditingPost(post)
    setSheetOpen(true)
  }

  async function handleDelete(post: Post) {
    if (!window.confirm(`Archive "${post.title}"? This cannot be undone.`)) return
    await deletePost(post.id)
    await refreshPosts()
  }

  function handleFormSuccess() {
    setSheetOpen(false)
    refreshPosts()
  }

  // Determine whether the current user can delete a given post
  function canDelete(post: Post): boolean {
    if (role === 'admin') return true
    if (role === 'editor' || role === 'author') {
      return post.author_id === profile.id
    }
    return false
  }

  const columns: ColumnDef<Post>[] = [
    {
      key: 'title',
      header: 'Title',
      className: 'max-w-[260px]',
      cell: (post) => (
        <button
          type="button"
          onClick={() => openEdit(post)}
          className="truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline max-w-[240px] block"
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
      header: 'Updated',
      cell: (post) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(post.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[100px]',
      cell: (post) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEdit(post)}
            aria-label={`Edit ${post.title}`}
          >
            <PencilIcon className="size-3.5" />
          </Button>
          {canDelete(post) && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(post)}
              aria-label={`Delete ${post.title}`}
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

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
        <Button onClick={openNew} size="sm">
          <PlusIcon />
          New Post
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={posts}
        searchPlaceholder="Search posts…"
      />

      {/* Sheet — create / edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingPost ? 'Edit Post' : 'New Post'}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <PostForm
              post={editingPost ?? undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
