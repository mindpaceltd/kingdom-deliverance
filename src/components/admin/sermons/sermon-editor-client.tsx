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
import { PublishPanel } from '../posts/publish-panel'
import { SeoPanel } from '../posts/seo-panel'
import { SeriesSelect } from './series-select'
import { AILinkProcessor } from './ai-link-processor'
import { DraftReviewModal, type SermonFormData } from './draft-review-modal'
import { createSermon, updateSermon, checkSlugAvailability } from '@/lib/actions/sermons'
import { generatePostContent } from '@/lib/actions/ai'
import { computeSeoScore } from '@/lib/seo-scorer'
import { cn, validateVideoUrl } from '@/lib/utils'
import { isAIProcessorEnabled } from '@/lib/env'
import type { Sermon, SermonSeries, SermonDraft } from '@/lib/types'
import { MediaPicker } from '../media-picker'

export interface SermonEditorClientProps {
  sermon?: Sermon
  allSeries: SermonSeries[]
}

interface FormState {
  title: string
  slug: string
  description: string
  content: string
  video_url: string
  audio_url: string
  thumbnail_url: string
  featured_image_alt: string
  preacher: string
  series_id: string | null
  date: string
  duration_minutes: string
  status: 'draft' | 'published' | 'scheduled'
  scheduled_at: string
  meta_title: string
  meta_description: string
  focus_keyword: string
}

export function SermonEditorClient({ sermon, allSeries }: SermonEditorClientProps) {
  const router = useRouter()
  const isEditing = Boolean(sermon)

  const [form, setForm] = React.useState<FormState>({
    title: sermon?.title ?? '',
    slug: sermon?.slug ?? '',
    description: sermon?.description ?? '',
    content: sermon?.content ?? '',
    video_url: sermon?.video_url ?? '',
    audio_url: sermon?.audio_url ?? '',
    thumbnail_url: sermon?.thumbnail_url ?? '',
    featured_image_alt: sermon?.featured_image_alt ?? '',
    preacher: sermon?.preacher ?? 'Bishop Climate Wiseman',
    series_id: sermon?.series_id ?? null,
    date: sermon?.date ?? new Date().toISOString().split('T')[0],
    duration_minutes: sermon?.duration_minutes ? String(sermon.duration_minutes) : '',
    status: (sermon?.status as any) ?? 'draft',
    scheduled_at: sermon?.scheduled_at ?? '',
    meta_title: sermon?.meta_title ?? '',
    meta_description: sermon?.meta_description ?? '',
    focus_keyword: sermon?.focus_keyword ?? '',
  })

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [draftSaved, setDraftSaved] = React.useState(false)
  const [slugError, setSlugError] = React.useState<string | null>(null)
  const slugCheckTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [videoUrlError, setVideoUrlError] = React.useState<string | null>(null)

  // AI state
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiError, setAiError] = React.useState<string | null>(null)
  const [showAiMenu, setShowAiMenu] = React.useState(false)
  const aiMenuRef = React.useRef<HTMLDivElement>(null)

  // Preview mode
  const [previewMode, setPreviewMode] = React.useState(false)

  // Draft Review Modal state
  const [draftReviewOpen, setDraftReviewOpen] = React.useState(false)
  const [currentDraft, setCurrentDraft] = React.useState<SermonDraft | null>(null)

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
        const result = await checkSlugAvailability(slug, sermon?.id)
        if (!result.available) setSlugError('This slug is already taken by another sermon.')
      }, 400)
    }
  }

  function handleVideoUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const url = e.target.value
    setField('video_url', url)
    if (url.trim() === '') {
      setVideoUrlError(null)
    } else if (validateVideoUrl(url) === 'invalid') {
      setVideoUrlError('Please enter a valid video URL')
    } else {
      setVideoUrlError(null)
    }
  }

  async function handleAiGenerate(mode: 'full' | 'improve') {
    setShowAiMenu(false)
    setAiError(null)

    if (!form.title.trim()) {
      setAiError('Please enter a sermon title before generating content.')
      return
    }

    setAiLoading(true)

    const result = await generatePostContent({
      mode: mode === 'full' ? 'sermon_full' : 'sermon_improve',
      title: form.title,
      excerpt: form.description || undefined,
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

  async function save(overrideStatus?: 'draft' | 'published' | 'scheduled') {
    if (videoUrlError) return
    setError(null)
    setSubmitting(true)

    const effectiveStatus = overrideStatus ?? form.status
    const { score } = computeSeoScore({
      focusKeyword: form.focus_keyword,
      seoTitle: form.meta_title || form.title,
      metaDescription: form.meta_description,
      content: form.content,
      slug: form.slug,
      featuredImage: form.thumbnail_url,
    })

    const payload = {
      ...form,
      status: effectiveStatus as 'draft' | 'published' | 'scheduled',
      seo_score: score,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
      scheduled_at: effectiveStatus === 'scheduled' && form.scheduled_at ? new Date(form.scheduled_at).toISOString() : undefined,
    }

    const result = isEditing
      ? await updateSermon(sermon!.id, payload)
      : await createSermon(payload)

    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    return result
  }

  async function handlePublish() {
    const result = await save()
    if (result) router.push('/admin/sermons')
  }

  async function handleSaveDraft() {
    const result = await save('draft')
    if (result) setDraftSaved(true)
  }

  /**
   * Handle draft generated from AI Link Processor
   * Opens the Draft Review Modal with the generated content
   */
  function handleDraftGenerated(draft: SermonDraft) {
    setCurrentDraft(draft)
    setDraftReviewOpen(true)
  }

  /**
   * Handle save from Draft Review Modal
   * Creates a new sermon with the reviewed data
   */
  async function handleDraftSave(data: SermonFormData, status: 'draft' | 'published') {
    setError(null)
    setSubmitting(true)

    const { score } = computeSeoScore({
      focusKeyword: data.keywords,
      seoTitle: data.title,
      metaDescription: data.description,
      content: data.content,
      slug: data.slug,
      featuredImage: data.thumbnail_url,
    })

    const payload = {
      title: data.title.trim(),
      slug: data.slug.trim(),
      description: data.description.trim() || undefined,
      content: data.content || undefined,
      video_url: data.video_url.trim() || undefined,
      audio_url: data.audio_url.trim() || undefined,
      thumbnail_url: data.thumbnail_url || undefined,
      featured_image_alt: '',
      preacher: data.preacher.trim(),
      series_id: data.series ? null : null, // TODO: Handle series lookup
      date: data.date,
      duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : undefined,
      status,
      seo_score: score,
      meta_title: data.title,
      meta_description: data.description,
      focus_keyword: data.keywords,
    }

    const result = await createSermon(payload)

    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      throw new Error(result.error)
    }

    // Close modal and redirect to sermons list
    setDraftReviewOpen(false)
    setCurrentDraft(null)
    router.push('/admin/sermons')
  }

  /**
   * Handle close of Draft Review Modal
   */
  function handleDraftClose() {
    setDraftReviewOpen(false)
    setCurrentDraft(null)
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden -m-6">
      {/* Top bar */}
      <div className="shrink-0 sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/sermons')}
          className="gap-1.5"
        >
          <ArrowLeftIcon className="size-4" />
          Sermons
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {isEditing ? 'Editing sermon' : 'New sermon'}
        </span>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* AI Link Processor Section - Only show when creating new sermon */}
            {!isEditing && (
              <>
                {isAIProcessorEnabled ? (
                  <AILinkProcessor onDraftGenerated={handleDraftGenerated} />
                ) : (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      AI link processing is currently unavailable. Please enter sermon content manually.
                    </p>
                  </div>
                )}
                
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or enter manually
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Title */}
            <Input
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Sermon title"
              required
              className="text-2xl font-bold h-auto py-3 border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-ring placeholder:text-muted-foreground/50"
            />

            {/* Slug */}
            <SlugInput
              title={form.title}
              value={form.slug}
              onChange={handleSlugChange}
              disabled={submitting}
            />
            {slugError && <p className="text-sm text-destructive -mt-4">{slugError}</p>}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Preacher</Label>
                <Input
                  value={form.preacher}
                  onChange={(e) => setField('preacher', e.target.value)}
                  placeholder="Preacher name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Series</Label>
                <SeriesSelect
                  value={form.series_id}
                  allSeries={allSeries}
                  onChange={(id) => setField('series_id', id)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Video URL (YouTube/Vimeo)</Label>
                <Input
                  value={form.video_url}
                  onChange={handleVideoUrlChange}
                  placeholder="https://youtube.com/..."
                />
                {videoUrlError && <p className="text-xs text-destructive">{videoUrlError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Audio URL (.mp3)</Label>
                <Input
                  value={form.audio_url}
                  onChange={(e) => setField('audio_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Duration (minutes)</Label>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setField('duration_minutes', e.target.value)}
                  placeholder="45"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Short summary..."
                rows={3}
              />
            </div>

            {/* Content Area with AI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Sermon Notes / Transcript</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode((p) => !p)}
                    className="gap-1.5 text-xs"
                  >
                    {previewMode ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                    {previewMode ? 'Edit' : 'Preview'}
                  </Button>
                  
                  {/* AI Button */}
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAiMenu(!showAiMenu)}
                      disabled={submitting || aiLoading}
                      className="gap-1.5 text-xs"
                    >
                      {aiLoading ? <LoaderIcon className="size-3.5 animate-spin" /> : <SparklesIcon className="size-3.5" />}
                      Generate with AI
                    </Button>
                    {showAiMenu && (
                       <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                         <button
                           type="button"
                           className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted"
                           onClick={() => handleAiGenerate('full')}
                         >
                           <SparklesIcon className="size-4 mt-0.5 shrink-0 text-primary" />
                           <div>
                             <p className="font-medium">Generate Transcript</p>
                             <p className="text-xs text-muted-foreground mt-0.5">Write notes from title</p>
                           </div>
                         </button>
                         <button
                           type="button"
                           className={cn(
                             "flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted",
                             !form.content.trim() && "opacity-40 pointer-events-none"
                           )}
                           onClick={() => handleAiGenerate('improve')}
                         >
                           <SparklesIcon className="size-4 mt-0.5 shrink-0 text-violet-500" />
                           <div>
                             <p className="font-medium">Improve Notes</p>
                             <p className="text-xs text-muted-foreground mt-0.5">Rewrite & expand</p>
                           </div>
                         </button>
                       </div>
                    )}
                  </div>
                </div>
              </div>
              
              {aiError && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{aiError}</p>}

              {previewMode ? (
                <div className="rounded-md border border-input bg-background px-4 py-3 min-h-[320px]">
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: form.content }} />
                </div>
              ) : (
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setField('content', html)}
                  placeholder="Write sermon notes here..."
                  disabled={submitting || aiLoading}
                />
              )}
            </div>

            {draftSaved && <p className="text-sm text-green-600">Draft saved successfully.</p>}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-80 shrink-0 border-l border-border overflow-y-auto px-4 py-6 space-y-4">
          <PublishPanel
            status={form.status}
            scheduledAt={form.scheduled_at}
            authorName={form.preacher}
            isEditing={isEditing}
            submitting={submitting}
            error={error}
            onStatusChange={(s) => setField('status', s as any)}
            onScheduledAtChange={(v) => setField('scheduled_at', v)}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
          />
          
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
             <h3 className="text-sm font-semibold">Thumbnail</h3>
             <MediaPicker
                value={form.thumbnail_url}
                onSelect={(url) => setField('thumbnail_url', url)}
                label="Select Thumbnail"
                accept="image"
             />
             <div className="space-y-1.5 pt-2">
                <Label className="text-xs">Thumbnail Alt Text (SEO)</Label>
                <Input
                  value={form.featured_image_alt}
                  onChange={(e) => setField('featured_image_alt', e.target.value)}
                  placeholder="Describe the image..."
                  className="h-8 text-xs"
                />
             </div>
          </div>

          <SeoPanel
            focusKeyword={form.focus_keyword}
            seoTitle={form.meta_title || form.title}
            metaDescription={form.meta_description}
            content={form.content}
            slug={form.slug}
            featuredImage={form.thumbnail_url}
            publicUrl={`https://kdcuganda.org/sermons/${form.slug || ''}`}
            onFocusKeywordChange={(v) => setField('focus_keyword', v)}
            onSeoTitleChange={(v) => setField('meta_title', v)}
            onMetaDescriptionChange={(v) => setField('meta_description', v)}
            disabled={submitting}
          />
        </aside>
      </div>

      {/* Draft Review Modal */}
      {currentDraft && (
        <DraftReviewModal
          draft={currentDraft}
          isOpen={draftReviewOpen}
          onClose={handleDraftClose}
          onSave={handleDraftSave}
        />
      )}
    </div>
  )
}
