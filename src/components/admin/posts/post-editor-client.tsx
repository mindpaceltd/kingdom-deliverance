'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, SparklesIcon } from 'lucide-react'
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
import { PublishPanel } from './publish-panel'
import { FeaturedImagePanel } from './featured-image-panel'
import { SeoPanel } from './seo-panel'
import { createPost, updatePost, checkSlugAvailability } from '@/lib/actions/posts'
import { computeSeoScore } from '@/lib/seo-scorer'
import type { Post } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostEditorClientProps {
  post?: Post  // undefined = new post mode
  authorName: string
}

interface FormState {
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image: string
  type: 'blog' | 'news'
  status: 'draft' | 'published' | 'scheduled'
  scheduled_at: string
  meta_title: string
  meta_description: string
  focus_keyword: string
}

// ---------------------------------------------------------------------------
// PostEditorClient
// ---------------------------------------------------------------------------

export function PostEditorClient({ post, authorName }: PostEditorClientProps) {
  const router = useRouter()
  const isEditing = Boolean(post)

  const [form, setForm] = React.useState<FormState>({
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? '',
    featured_image: post?.featured_image ?? '',
    type: post?.type ?? 'blog',
    status:
      post?.status === 'archived' || post?.status === 'trash'
        ? 'draft'
        : (post?.status as 'draft' | 'published' | 'scheduled') ?? 'draft',
    scheduled_at: post?.scheduled_at ?? '',
    meta_title: post?.meta_title ?? '',
    meta_description: post?.meta_description ?? '',
    focus_keyword: post?.focus_keyword ?? '',
  })

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [draftSaved, setDraftSaved] = React.useState(false)
  const [slugError, setSlugError] = React.useState<string | null>(null)
  const slugCheckTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
    setDraftSaved(false)
  }

  function handleSlugChange(slug: string) {
    setField('slug', slug)
    setSlugError(null)

    if (slugCheckTimerRef.current) {
      clearTimeout(slugCheckTimerRef.current)
    }

    if (slug.trim()) {
      slugCheckTimerRef.current = setTimeout(async () => {
        const result = await checkSlugAvailability(slug, post?.id)
        if (!result.available) {
          setSlugError('This slug is already taken by another post.')
        }
      }, 400)
    }
  }

  // ---------------------------------------------------------------------------
  // Save helpers
  // ---------------------------------------------------------------------------

  async function save(overrideStatus?: 'draft' | 'published' | 'scheduled') {
    setError(null)
    setSubmitting(true)

    const effectiveStatus = overrideStatus ?? form.status

    // Compute SEO score at save time
    const { score } = computeSeoScore({
      focusKeyword: form.focus_keyword,
      seoTitle: form.meta_title || form.title,
      metaDescription: form.meta_description,
      content: form.content,
      slug: form.slug,
      featuredImage: form.featured_image,
    })

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || undefined,
      content: form.content || undefined,
      featured_image: form.featured_image || undefined,
      type: form.type,
      status: effectiveStatus,
      meta_title: form.meta_title.trim() || undefined,
      meta_description: form.meta_description.trim() || undefined,
      focus_keyword: form.focus_keyword.trim() || undefined,
      seo_score: score,
      scheduled_at:
        effectiveStatus === 'scheduled' && form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : undefined,
    }

    const result = isEditing
      ? await updatePost(post!.id, payload)
      : await createPost(payload)

    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    return result
  }

  async function handlePublish() {
    const result = await save()
    if (result) {
      router.push('/admin/posts')
    }
  }

  async function handleSaveDraft() {
    const result = await save('draft')
    if (result) {
      setDraftSaved(true)
    }
  }

  function handleAiGenerate() {
    // Coming soon — show inline notification
    setDraftSaved(false)
    // Use a temporary state to show the "Coming soon" message
    setError(null)
    // We'll use a separate state for the AI toast
    setAiToast(true)
    setTimeout(() => setAiToast(false), 3000)
  }

  const [aiToast, setAiToast] = React.useState(false)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/posts')}
          className="gap-1.5"
        >
          <ArrowLeftIcon className="size-4" />
          Posts
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {isEditing ? 'Editing post' : 'New post'}
        </span>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 gap-0">
        {/* Left: main content panel */}
        <main className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-1.5">
              <Input
                id="post-title"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Post title"
                required
                disabled={submitting}
                className="text-2xl font-bold h-auto py-3 border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-ring placeholder:text-muted-foreground/50"
                aria-label="Post title"
              />
            </div>

            {/* Slug */}
            <SlugInput
              title={form.title}
              value={form.slug}
              onChange={handleSlugChange}
              disabled={submitting}
            />
            {slugError && (
              <p role="alert" className="text-sm text-destructive">
                {slugError}
              </p>
            )}

            {/* Type selector */}
            <div className="space-y-1.5">
              <Label htmlFor="post-type" className="text-sm font-medium">
                Post Type
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) => setField('type', v as 'blog' | 'news')}
                disabled={submitting}
              >
                <SelectTrigger id="post-type" className="w-40">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <Label htmlFor="post-excerpt" className="text-sm font-medium">
                Excerpt
              </Label>
              <Textarea
                id="post-excerpt"
                value={form.excerpt}
                onChange={(e) => setField('excerpt', e.target.value)}
                placeholder="Short summary shown in listings…"
                rows={3}
                disabled={submitting}
                className="resize-none"
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Content</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiGenerate}
                  disabled={submitting}
                  className="gap-1.5 text-xs"
                >
                  <SparklesIcon className="size-3.5" />
                  Generate with AI
                </Button>
              </div>

              {/* AI "Coming soon" toast */}
              {aiToast && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
                >
                  Coming soon
                </div>
              )}

              <RichTextEditor
                value={form.content}
                onChange={(html) => setField('content', html)}
                placeholder="Write your post content here…"
                disabled={submitting}
              />
            </div>

            {/* Draft saved confirmation */}
            {draftSaved && (
              <p role="status" aria-live="polite" className="text-sm text-green-600 dark:text-green-400">
                Draft saved successfully.
              </p>
            )}
          </div>
        </main>

        {/* Right: sidebar */}
        <aside className="w-80 shrink-0 border-l border-border overflow-y-auto px-4 py-8 space-y-4">
          {/* Publish Panel */}
          <PublishPanel
            status={form.status}
            scheduledAt={form.scheduled_at}
            authorName={authorName}
            isEditing={isEditing}
            submitting={submitting}
            error={error}
            onStatusChange={(s) => setField('status', s)}
            onScheduledAtChange={(v) => setField('scheduled_at', v)}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
          />

          {/* Featured Image Panel */}
          <FeaturedImagePanel
            value={form.featured_image}
            onChange={(url) => setField('featured_image', url)}
            disabled={submitting}
          />

          {/* SEO Panel */}
          <SeoPanel
            focusKeyword={form.focus_keyword}
            seoTitle={form.meta_title || form.title}
            metaDescription={form.meta_description}
            content={form.content}
            slug={form.slug}
            featuredImage={form.featured_image}
            publicUrl={`https://kdcuganda.org/blog/${form.slug || ''}`}
            onFocusKeywordChange={(v) => setField('focus_keyword', v)}
            onSeoTitleChange={(v) => setField('meta_title', v)}
            onMetaDescriptionChange={(v) => setField('meta_description', v)}
            disabled={submitting}
          />
        </aside>
      </div>
    </div>
  )
}
