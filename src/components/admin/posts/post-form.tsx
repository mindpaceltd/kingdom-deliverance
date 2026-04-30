'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SlugInput } from '@/components/admin/slug-input'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { MediaPicker } from '@/components/admin/media-picker'
import { createPost, updatePost } from '@/lib/actions/posts'
import type { Post } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostFormProps {
  /** When provided, the form is in edit mode */
  post?: Post
  onSuccess: () => void
  onCancel: () => void
}

interface FormState {
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image: string
  type: 'blog' | 'news'
  status: 'draft' | 'published'
}

// ---------------------------------------------------------------------------
// PostForm
// ---------------------------------------------------------------------------

export function PostForm({ post, onSuccess, onCancel }: PostFormProps) {
  const isEditing = Boolean(post)

  const [form, setForm] = React.useState<FormState>({
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? '',
    featured_image: post?.featured_image ?? '',
    type: post?.type ?? 'blog',
    status: post?.status === 'archived' || post?.status === 'scheduled' || post?.status === 'trash'
      ? 'draft'
      : (post?.status as 'draft' | 'published') ?? 'draft',
  })

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || undefined,
      content: form.content || undefined,
      featured_image: form.featured_image || undefined,
      type: form.type,
      status: form.status,
    }

    const result = isEditing
      ? await updatePost(post!.id, payload)
      : await createPost(payload)

    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="post-title">Title</Label>
        <Input
          id="post-title"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Post title"
          required
          disabled={submitting}
        />
      </div>

      {/* Slug */}
      <SlugInput
        title={form.title}
        value={form.slug}
        onChange={(slug) => setField('slug', slug)}
        disabled={submitting}
      />

      {/* Excerpt */}
      <div className="space-y-1.5">
        <Label htmlFor="post-excerpt">Excerpt</Label>
        <Textarea
          id="post-excerpt"
          value={form.excerpt}
          onChange={(e) => setField('excerpt', e.target.value)}
          placeholder="Short summary shown in listings…"
          rows={3}
          disabled={submitting}
        />
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <Label>Content</Label>
        <RichTextEditor
          value={form.content}
          onChange={(html) => setField('content', html)}
          placeholder="Write your post content here…"
          disabled={submitting}
        />
      </div>

      {/* Featured Image */}
      <div className="space-y-1.5">
        <Label>Featured Image</Label>
        <p className="text-[11px] text-muted-foreground">Recommended size: 1200x630px (16:9 ratio)</p>
        <MediaPicker
          value={form.featured_image || undefined}
          onSelect={(url) => setField('featured_image', url)}
          label="Select Image"
          accept="image"
        />
      </div>

      {/* Type + Status row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Type */}
        <div className="space-y-1.5">
          <Label htmlFor="post-type">Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) => setField('type', v as 'blog' | 'news')}
            disabled={submitting}
          >
            <SelectTrigger id="post-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blog">Blog</SelectItem>
              <SelectItem value="news">News</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label htmlFor="post-status">Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setField('status', v as 'draft' | 'published')}
            disabled={submitting}
          >
            <SelectTrigger id="post-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inline error */}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Post'}
        </Button>
      </div>
    </form>
  )
}
