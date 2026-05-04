'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  SparklesIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderIcon,
  Calendar,
  Clock,
  MapPin,
  Link2,
  Star,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SlugInput } from '@/components/admin/slug-input'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { PublishPanel, type StatusOption } from '../posts/publish-panel'
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

const EVENT_STATUSES: StatusOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'published', label: 'Published' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'scheduled', label: 'Scheduled' },
]

export function EventEditorClient({ event }: EventEditorClientProps) {
  const router = useRouter()
  const isEditing = Boolean(event)

  const [form, setForm] = React.useState<FormState>({
    title: event?.title ?? '',
    slug: event?.slug ?? '',
    description: event?.description ?? '',
    content: event?.content ?? '',
    date: event?.date ?? '',
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
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    if (!isEditing && !form.date) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      setField('date', tomorrow.toISOString().slice(0, 16))
    }
  }, [isEditing])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
    setSaved(false)
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
      mode: mode === 'full' ? 'sermon_full' : 'sermon_improve',
      title: form.title,
      existingContent: form.content || undefined,
    })
    if ('html' in result) setField('content', result.html)
    setAiLoading(false)
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
    setSaved(true)
    return true
  }

  async function handlePublish() {
    const statusToSave =
      form.status === 'draft' || form.status === 'scheduled'
        ? 'upcoming'
        : form.status
    if (await save(statusToSave as any)) router.push('/admin/events')
  }

  async function handleSaveDraft() {
    await save('draft')
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden -m-6">
      {/* ── Top bar ── */}
      <div className="shrink-0 sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/events')}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Events
        </Button>

        <div className="h-4 w-px bg-border" />

        <span className="text-sm font-semibold text-foreground truncate max-w-[300px]">
          {form.title || (isEditing ? 'Edit Event' : 'New Event')}
        </span>

        <div className="flex-1" />

        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <CheckCircle2 className="size-3.5" /> Saved
          </span>
        )}

        {isEditing && (
          <Button variant="outline" size="sm" asChild className="gap-2 h-8">
            <a href={`/events/${form.slug}`} target="_blank" rel="noreferrer">
              <EyeIcon className="size-3.5" />
              Preview
            </a>
          </Button>
        )}

        <Button
          size="sm"
          onClick={handlePublish}
          disabled={submitting}
          className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          {submitting ? (
            <LoaderIcon className="size-3.5 animate-spin" />
          ) : null}
          {isEditing ? 'Save & Publish' : 'Create Event'}
        </Button>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Editor ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
            {/* Title */}
            <div className="space-y-3">
              <Input
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Event title…"
                required
                className="text-3xl font-serif font-bold h-auto py-3 border-0 border-b-2 border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/30 shadow-none bg-transparent"
              />
              <SlugInput
                title={form.title}
                value={form.slug}
                onChange={handleSlugChange}
                disabled={submitting}
              />
              {slugError && (
                <p className="text-xs text-destructive">{slugError}</p>
              )}
            </div>

            {/* Date / Location card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/30">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Event Details
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Dates */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                      <Calendar className="size-3.5 text-accent" />
                      Start Date &amp; Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={
                        form.date.includes('T')
                          ? form.date.slice(0, 16)
                          : form.date
                            ? `${form.date}T10:00`
                            : ''
                      }
                      onChange={(e) => setField('date', e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                      <Clock className="size-3.5" />
                      End Date &amp; Time
                      <span className="text-[10px] normal-case font-normal">(optional)</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      value={
                        form.end_date
                          ? form.end_date.includes('T')
                            ? form.end_date.slice(0, 16)
                            : `${form.end_date}T12:00`
                          : ''
                      }
                      onChange={(e) => setField('end_date', e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>

                {/* Location + Registration */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                      <MapPin className="size-3.5 text-accent" />
                      Location
                    </Label>
                    <Input
                      value={form.location}
                      onChange={(e) => setField('location', e.target.value)}
                      placeholder="e.g. Kingdom Temple, Kampala"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                      <Link2 className="size-3.5" />
                      Registration URL
                      <span className="text-[10px] normal-case font-normal">(optional)</span>
                    </Label>
                    <Input
                      value={form.registration_url}
                      onChange={(e) =>
                        setField('registration_url', e.target.value)
                      }
                      placeholder="https://eventbrite.com/…"
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Short Description
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Shown in event listings
                </span>
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="A brief summary of the event…"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Rich content */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Detailed Information
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode((p) => !p)}
                    className="gap-1.5 h-7 text-xs"
                  >
                    {previewMode ? (
                      <EyeOffIcon className="size-3.5" />
                    ) : (
                      <EyeIcon className="size-3.5" />
                    )}
                    {previewMode ? 'Edit' : 'Preview'}
                  </Button>

                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAiMenu(!showAiMenu)}
                      disabled={submitting || aiLoading || !form.title.trim()}
                      className="gap-1.5 h-7 text-xs border-accent/30 text-accent hover:bg-accent/5"
                    >
                      {aiLoading ? (
                        <LoaderIcon className="size-3.5 animate-spin" />
                      ) : (
                        <SparklesIcon className="size-3.5" />
                      )}
                      AI Assist
                    </Button>
                    {showAiMenu && (
                      <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted transition-colors"
                          onClick={() => handleAiGenerate('full')}
                        >
                          <SparklesIcon className="size-4 mt-0.5 shrink-0 text-accent" />
                          <div>
                            <p className="font-semibold text-xs">Generate Content</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Write from title
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted transition-colors border-t border-border"
                          onClick={() => handleAiGenerate('improve')}
                        >
                          <SparklesIcon className="size-4 mt-0.5 shrink-0 text-violet-500" />
                          <div>
                            <p className="font-semibold text-xs">Polish Content</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Improve existing text
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {previewMode ? (
                <div className="rounded-2xl border border-input bg-card p-8 min-h-[400px]">
                  {form.content ? (
                    <div
                      className="prose prose-lg dark:prose-invert max-w-none font-serif"
                      dangerouslySetInnerHTML={{ __html: form.content }}
                    />
                  ) : (
                    <p className="text-muted-foreground italic text-sm">
                      No content yet.
                    </p>
                  )}
                </div>
              ) : (
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setField('content', html)}
                  placeholder="Describe the event in detail — schedule, speakers, what to expect…"
                  disabled={submitting || aiLoading}
                />
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </main>

        {/* ── Sidebar ── */}
        <aside className="w-[320px] shrink-0 border-l border-border overflow-y-auto bg-muted/5">
          <div className="px-5 py-6 space-y-5">
            <PublishPanel
              status={form.status as any}
              scheduledAt={form.scheduled_at}
              authorName="Admin"
              isEditing={isEditing}
              submitting={submitting}
              error={null}
              onStatusChange={(s) => setField('status', s as any)}
              onScheduledAtChange={(v) => setField('scheduled_at', v)}
              onPublish={handlePublish}
              onSaveDraft={handleSaveDraft}
              customStatuses={EVENT_STATUSES}
            />

            {/* Banner Image */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Banner Image
                </h3>
                <MediaPicker
                  value={form.image_url}
                  onSelect={(url) => setField('image_url', url)}
                  label="Change"
                  accept="image"
                />
              </div>
              {form.image_url ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden border">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                  <p className="text-xs text-muted-foreground text-center px-4 italic">
                    No image selected
                  </p>
                </div>
              )}

              {/* Featured toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-accent/5 border border-accent/15 hover:bg-accent/10 transition-colors">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={form.is_featured}
                  onChange={(e) => setField('is_featured', e.target.checked)}
                  className="rounded border-gray-300 text-accent focus:ring-accent h-4 w-4"
                />
                <div>
                  <p className="text-xs font-bold text-accent flex items-center gap-1">
                    <Star className="size-3 fill-accent" />
                    Feature on Homepage
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Highlights this event prominently
                  </p>
                </div>
              </label>
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
          </div>
        </aside>
      </div>
    </div>
  )
}
