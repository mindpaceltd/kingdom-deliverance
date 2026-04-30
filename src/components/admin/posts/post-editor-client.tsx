'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, SparklesIcon, EyeIcon, EyeOffIcon, LoaderIcon } from 'lucide-react'
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
import { TagInput } from './tag-input'
import { SharePanel } from './share-panel'
import { createPost, updatePost, checkSlugAvailability } from '@/lib/actions/posts'
import { generatePostContent } from '@/lib/actions/ai'
import { computeSeoScore } from '@/lib/seo-scorer'
import { cn } from '@/lib/utils'
import type { Post, Tag } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostEditorClientProps {
  post?: Post
  authorName: string
  allTags: Tag[]
  initialTags?: Tag[]
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

export function PostEditorClient({ post, authorName, allTags, initialTags = [] }: PostEditorClientProps) {
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

  // Tags state — keep a local copy of all known tags so newly created ones appear in autocomplete
  const [selectedTags, setSelectedTags] = React.useState<Tag[]>(initialTags)
  const [knownTags] = React.useState<Tag[]>(allTags)

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [draftSaved, setDraftSaved] = React.useState(false)
  const [slugError, setSlugError] = React.useState<string | null>(null)
  const slugCheckTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // AI state
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiError, setAiError] = React.useState<string | null>(null)
  const [showAiMenu, setShowAiMenu] = React.useState(false)
  const aiMenuRef = React.useRef<HTMLDivElement>(null)

  // Preview mode
  const [previewMode, setPreviewMode] = React.useState(false)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
    setDraftSaved(false)
  }

  function handleSlugChange(slug: string) {
    setField('slug', slug)
    setSlugError(null)
    if (slugCheckTimerRef.current) clearTimeout(slugCheckTimerRef.current)
    if (slug.trim()) {
      slugCheckTimerRef.current = setTimeout(async () => {
        const result = await checkSlugAvailability(slug, post?.id)
        if (!result.available) setSlugError('This slug is already taken by another post.')
      }, 400)
    }
  }

  // Close AI menu on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (aiMenuRef.current && !aiMenuRef.current.contains(e.target as Node)) {
        setShowAiMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ---------------------------------------------------------------------------
  // AI generation
  // ---------------------------------------------------------------------------

  async function handleAiGenerate(mode: 'full' | 'improve') {
    setShowAiMenu(false)
    setAiError(null)

    if (!form.title.trim()) {
      setAiError('Please enter a post title before generating content.')
      return
    }

    if (mode === 'improve' && !form.content.trim()) {
      setAiError('There is no existing content to improve. Use "Generate Full Post" instead.')
      return
    }

    setAiLoading(true)

    const result = await generatePostContent({
      mode,
      title: form.title,
      excerpt: form.excerpt || undefined,
      existingContent: form.content || undefined,
      focusKeyword: form.focus_keyword || undefined,
    })

    setAiLoading(false)

    if ('error' in result) {
      setAiError(result.error)
      return
    }

    setField('content', result.html)
  }

  // ---------------------------------------------------------------------------
  // Tag helpers — handled directly in TagInput via /api/tags
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Save helpers
  // ---------------------------------------------------------------------------

  async function save(overrideStatus?: 'draft' | 'published' | 'scheduled') {
    setError(null)
    setSubmitting(true)

    const effectiveStatus = overrideStatus ?? form.status
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

    // Sync tags via API route (more reliable than server action in production)
    const postId = isEditing ? post!.id : (result as { success: true; id: string }).id
    try {
      await fetch('/api/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, tagIds: selectedTags.map((t) => t.id) }),
      })
    } catch (e) {
      console.error('[save] syncPostTags error:', e)
    }

    return result
  }

  async function handlePublish() {
    const result = await save()
    if (result) router.push('/admin/posts')
  }

  async function handleSaveDraft() {
    const result = await save('draft')
    if (result) setDraftSaved(true)
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top bar — fixed height */}
      <div className="shrink-0 sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
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

      {/* Main layout — fills remaining height, both panels scroll independently */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: main content — scrolls independently */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Title */}
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

            {/* Slug */}
            <SlugInput
              title={form.title}
              value={form.slug}
              onChange={handleSlugChange}
              disabled={submitting}
            />
            {slugError && (
              <p role="alert" className="text-sm text-destructive -mt-4">
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
            <div className="space-y-2">
              {/* Content header row */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Content</Label>
                <div className="flex items-center gap-2">
                  {/* Preview toggle */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode((p) => !p)}
                    className="gap-1.5 text-xs"
                    title={previewMode ? 'Back to editor' : 'Preview content'}
                  >
                    {previewMode ? (
                      <>
                        <EyeOffIcon className="size-3.5" />
                        Edit
                      </>
                    ) : (
                      <>
                        <EyeIcon className="size-3.5" />
                        Preview
                      </>
                    )}
                  </Button>

                  {/* AI Generate button + dropdown */}
                  <div className="relative" ref={aiMenuRef}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAiMenu((v) => !v)}
                      disabled={submitting || aiLoading}
                      className="gap-1.5 text-xs"
                    >
                      {aiLoading ? (
                        <LoaderIcon className="size-3.5 animate-spin" />
                      ) : (
                        <SparklesIcon className="size-3.5" />
                      )}
                      {aiLoading ? 'Generating…' : 'Generate with AI'}
                    </Button>

                    {/* Dropdown menu */}
                    {showAiMenu && (
                      <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted transition-colors"
                          onClick={() => handleAiGenerate('full')}
                        >
                          <SparklesIcon className="size-4 mt-0.5 shrink-0 text-primary" />
                          <div>
                            <p className="font-medium">Generate Full Post</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Write a complete post from your title
                            </p>
                          </div>
                        </button>
                        <div className="border-t border-border" />
                        <button
                          type="button"
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted transition-colors',
                            !form.content.trim() && 'opacity-40 pointer-events-none'
                          )}
                          onClick={() => handleAiGenerate('improve')}
                        >
                          <SparklesIcon className="size-4 mt-0.5 shrink-0 text-violet-500" />
                          <div>
                            <p className="font-medium">Improve Content</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Rewrite &amp; expand existing content
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI error */}
              {aiError && (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {aiError}
                </p>
              )}

              {/* AI loading overlay message */}
              {aiLoading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-primary"
                >
                  <LoaderIcon className="size-4 animate-spin" />
                  Gemini AI is writing your post…
                </div>
              )}

              {/* Preview mode */}
              {previewMode ? (
                <div className="rounded-md border border-input bg-background px-4 py-3 min-h-[320px]">
                  {form.content ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: form.content }}
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm italic">No content yet.</p>
                  )}
                </div>
              ) : (
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setField('content', html)}
                  placeholder="Write your post content here…"
                  disabled={submitting || aiLoading}
                />
              )}
            </div>

            {/* Draft saved confirmation */}
            {draftSaved && (
              <p role="status" aria-live="polite" className="text-sm text-green-600 dark:text-green-400">
                Draft saved successfully.
              </p>
            )}
          </div>
        </main>

        {/* Right: sidebar — scrolls independently, stays fixed while content scrolls */}
        <aside className="w-80 shrink-0 border-l border-border overflow-y-auto px-4 py-6 space-y-4">
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
          <FeaturedImagePanel
            value={form.featured_image}
            onChange={(url) => setField('featured_image', url)}
            disabled={submitting}
          />

          {/* Tags Panel */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Tags</h3>
            <TagInput
              value={selectedTags}
              allTags={knownTags}
              onChange={setSelectedTags}
              disabled={submitting}
            />
          </div>

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

          {/* Share Panel */}
          <SharePanel
            title={form.title}
            excerpt={form.excerpt}
            featuredImage={form.featured_image}
            slug={form.slug}
            status={form.status}
          />
        </aside>
      </div>
    </div>
  )
}
