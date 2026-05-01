'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, SparklesIcon, EyeIcon, EyeOffIcon, LoaderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SlugInput } from '@/components/admin/slug-input'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { PublishPanel } from '../posts/publish-panel'
import { SeoPanel } from '../posts/seo-panel'
import { MediaPicker } from '../media-picker'
import { createEvent, updateEvent, checkSlugAvailability } from '@/lib/actions/events'
import { generatePostContent } from '@/lib/actions/ai'
import { computeSeoScore } from '@/lib/seo-scorer'
import { cn } from '@/lib/utils'
import type { Event } from '@/lib/types'

interface EventEditorClientProps {
  event?: Event
}

interface FormState {
  title: string
  slug: string
  description: string
  content: string
  date: string
  end_date: string
  location: string
  image_url: string
  is_featured: boolean
  registration_url: string
  status: Event['status']
  scheduled_at: string
  meta_title: string
  meta_description: string
  focus_keyword: string
}

export function EventEditorClient({ event }: EventEditorClientProps) {
  const router = useRouter()
  const isEditing = Boolean(event)

  const [form, setForm] = React.useState<FormState>({
    title: event?.title ?? '',
    slug: event?.slug ?? '',
    description: event?.description ?? '',
    content: event?.content ?? '',
    date: event?.date ?? new Date().toISOString().split('T')[0],
    end_date: event?.end_date ?? '',
    location: event?.location ?? '',
    image_url: event?.image_url ?? '',
    is_featured: event?.is_featured ?? false,
    registration_url: event?.registration_url ?? '',
    status: (event?.status as any) ?? 'draft',
    scheduled_at: event?.scheduled_at ?? '',
    meta_title: event?.meta_title ?? '',
    meta_description: event?.meta_description ?? '',
    focus_keyword: event?.focus_keyword ?? '',
  })

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [slugError, setSlugError] = React.useState<string | null>(null)
  const [aiLoading, setAiLoading] = React.useState(false)
  const [showAiMenu, setShowAiMenu] = React.useState(false)
  const [previewMode, setPreviewMode] = React.useState(false)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  async function handleSlugChange(slug: string) {
    setField('slug', slug)
    const result = await checkSlugAvailability(slug, event?.id)
    if (!result.available) setSlugError('Slug already taken')
    else setSlugError(null)
  }

  async function handleAiGenerate(mode: 'full' | 'improve') {
    setShowAiMenu(false)
    if (!form.title.trim()) return
    setAiLoading(true)
    const result = await generatePostContent({
      mode: mode === 'full' ? 'sermon_full' : 'sermon_improve', // Use sermon template for now or add event template
      title: form.title,
      existingContent: form.content || undefined,
    })
    setAiLoading(false)
    if ('html' in result) setField('content', result.html)
  }

  async function save(overrideStatus?: Event['status']) {
    setSubmitting(true)
    const effectiveStatus = overrideStatus ?? form.status
    const { score } = computeSeoScore({
      focusKeyword: form.focus_keyword,
      seoTitle: form.meta_title || form.title,
      metaDescription: form.meta_description,
      content: form.content,
      slug: form.slug,
      featuredImage: form.image_url,
    })

    const payload = {
      ...form,
      status: effectiveStatus as any,
      seo_score: score,
    }

    const result = isEditing
      ? await updateEvent(event!.id, payload)
      : await createEvent(payload)

    setSubmitting(false)
    if ('error' in result) {
      setError(result.error)
      return false
    }
    return true
  }

  async function handlePublish() {
    if (await save('published')) router.push('/admin/events')
  }

  async function handleSaveDraft() {
    await save('draft')
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden -m-6">
      {/* Top bar */}
      <div className="shrink-0 sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/events')}
          className="gap-1.5"
        >
          <ArrowLeftIcon className="size-4" />
          Events
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {isEditing ? 'Editing event' : 'New event'}
        </span>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <Input
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Event title"
              required
              className="text-2xl font-bold h-auto py-3 border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-ring placeholder:text-muted-foreground/50"
            />

            <SlugInput
              title={form.title}
              value={form.slug}
              onChange={handleSlugChange}
              disabled={submitting}
            />
            {slugError && <p className="text-xs text-destructive -mt-4">{slugError}</p>}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Start Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.date.includes('T') ? form.date.slice(0, 16) : `${form.date}T10:00`}
                  onChange={(e) => setField('date', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">End Date & Time (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.end_date ? (form.end_date.includes('T') ? form.end_date.slice(0, 16) : `${form.end_date}T12:00`) : ''}
                  onChange={(e) => setField('end_date', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setField('location', e.target.value)}
                placeholder="e.g. Kingdom Temple, London"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Registration/Ticket URL (Optional)</Label>
              <Input
                value={form.registration_url}
                onChange={(e) => setField('registration_url', e.target.value)}
                placeholder="https://eventbrite.com/..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Short Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Brief summary..."
                rows={3}
              />
            </div>

            {/* Content Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Full Event Details</Label>
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
                      AI Assist
                    </Button>
                    {showAiMenu && (
                       <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                         <button
                           type="button"
                           className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted"
                           onClick={() => handleAiGenerate('full')}
                         >
                           <SparklesIcon className="size-4 mt-0.5 shrink-0 text-primary" />
                           <div>
                             <p className="font-medium text-xs">Generate Details</p>
                           </div>
                         </button>
                         <button
                           type="button"
                           className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted"
                           onClick={() => handleAiGenerate('improve')}
                         >
                           <SparklesIcon className="size-4 mt-0.5 shrink-0 text-violet-500" />
                           <div>
                             <p className="font-medium text-xs">Improve Content</p>
                           </div>
                         </button>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {previewMode ? (
                <div className="rounded-md border border-input bg-background px-4 py-3 min-h-[320px]">
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: form.content }} />
                </div>
              ) : (
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setField('content', html)}
                  placeholder="Describe the event in detail..."
                  disabled={submitting || aiLoading}
                />
              )}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-80 shrink-0 border-l border-border overflow-y-auto px-4 py-6 space-y-4">
          <PublishPanel
            status={form.status as any}
            scheduledAt={form.scheduled_at}
            authorName="Admin"
            isEditing={isEditing}
            submitting={submitting}
            error={error}
            onStatusChange={(s) => setField('status', s as any)}
            onScheduledAtChange={(v) => setField('scheduled_at', v)}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
          />
          
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
             <h3 className="text-sm font-semibold">Event Image</h3>
             <MediaPicker
                value={form.image_url}
                onSelect={(url) => setField('image_url', url)}
                label="Select Banner"
                accept="image"
             />
             <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={form.is_featured}
                  onChange={(e) => setField('is_featured', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <Label htmlFor="is_featured" className="text-xs cursor-pointer">Feature this event</Label>
             </div>
          </div>

          <SeoPanel
            focusKeyword={form.focus_keyword}
            seoTitle={form.meta_title || form.title}
            metaDescription={form.meta_description}
            content={form.content}
            slug={form.slug}
            featuredImage={form.image_url}
            publicUrl={`https://kdcuganda.org/events/${form.slug || ''}`}
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
