'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, SparklesIcon, EyeIcon, EyeOffIcon, LoaderIcon, Calendar, Clock, MapPin } from 'lucide-react'
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
  { value: 'published', label: 'Published' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
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
      mode: mode === 'full' ? 'sermon_full' : 'sermon_improve', 
      title: form.title,
      existingContent: form.content || undefined,
    })
    setAiLoading(true) // Keep loading state until update
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
    return true
  }

  async function handlePublish() {
    // For events, 'upcoming' is the primary "published" state
    const statusToSave = form.status === 'draft' || form.status === 'scheduled' ? 'upcoming' : form.status
    if (await save(statusToSave as any)) router.push('/admin/events')
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
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {isEditing ? 'Editing Event' : 'New Event'}
        </span>
        <div className="flex items-center gap-2">
           {isEditing && (
             <Button variant="outline" size="sm" asChild>
               <a href={`/events/${form.slug}`} target="_blank" rel="noreferrer" className="gap-2">
                 <EyeIcon className="size-3.5" />
                 Preview Site
               </a>
             </Button>
           )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <Input
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Event title"
                required
                className="text-3xl font-serif font-bold h-auto py-4 border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-ring placeholder:text-muted-foreground/30 shadow-none"
              />

              <SlugInput
                title={form.title}
                value={form.slug}
                onChange={handleSlugChange}
                disabled={submitting}
              />
              {slugError && <p className="text-xs text-destructive -mt-4">{slugError}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card border rounded-2xl p-6 shadow-sm">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="size-3.5 text-accent" />
                    Start Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.date.includes('T') ? form.date.slice(0, 16) : `${form.date}T10:00`}
                    onChange={(e) => setField('date', e.target.value)}
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="size-3.5 text-muted-foreground" />
                    End Date & Time (Optional)
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.end_date ? (form.end_date.includes('T') ? form.end_date.slice(0, 16) : `${form.end_date}T12:00`) : ''}
                    onChange={(e) => setField('end_date', e.target.value)}
                    className="bg-muted/30"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="size-3.5 text-accent" />
                    Location
                  </Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setField('location', e.target.value)}
                    placeholder="e.g. Kingdom Temple, London"
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="size-3.5 text-muted-foreground" />
                    Registration URL
                  </Label>
                  <Input
                    value={form.registration_url}
                    onChange={(e) => setField('registration_url', e.target.value)}
                    placeholder="https://eventbrite.com/..."
                    className="bg-muted/30"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Short Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Brief summary for listings..."
                rows={3}
                className="resize-none border-dashed bg-muted/10"
              />
            </div>

            {/* Content Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Detailed Information</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode((p) => !p)}
                    className="gap-1.5 text-[10px] uppercase font-bold"
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
                      className="gap-1.5 text-[10px] uppercase font-bold border-accent/20 text-accent hover:bg-accent/5"
                    >
                      {aiLoading ? <LoaderIcon className="size-3.5 animate-spin" /> : <SparklesIcon className="size-3.5" />}
                      AI Assist
                    </Button>
                    {showAiMenu && (
                       <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
                         <button
                           type="button"
                           className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted transition-colors"
                           onClick={() => handleAiGenerate('full')}
                         >
                           <SparklesIcon className="size-4 mt-0.5 shrink-0 text-accent" />
                           <div>
                             <p className="font-bold text-xs">Generate Plan</p>
                           </div>
                         </button>
                         <button
                           type="button"
                           className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted transition-colors"
                           onClick={() => handleAiGenerate('improve')}
                         >
                           <SparklesIcon className="size-4 mt-0.5 shrink-0 text-violet-500" />
                           <div>
                             <p className="font-bold text-xs">Polish Content</p>
                           </div>
                         </button>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {previewMode ? (
                <div className="rounded-2xl border border-input bg-card p-8 min-h-[400px] shadow-inner">
                  <div className="prose prose-lg dark:prose-invert max-w-none font-serif" dangerouslySetInnerHTML={{ __html: form.content }} />
                </div>
              ) : (
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setField('content', html)}
                  placeholder="Describe the event in detail, add speaker lists, schedule, etc..."
                  disabled={submitting || aiLoading}
                />
              )}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-85 shrink-0 border-l border-border overflow-y-auto px-5 py-8 space-y-6 bg-muted/5">
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
            customStatuses={EVENT_STATUSES}
          />
          
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
             <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold uppercase tracking-tight">Banner Image</h3>
               <MediaPicker
                  value={form.image_url}
                  onSelect={(url) => setField('image_url', url)}
                  label="Change"
                  accept="image"
               />
             </div>
             {form.image_url ? (
               <div className="aspect-video w-full rounded-lg overflow-hidden border">
                 <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
               </div>
             ) : (
               <div className="aspect-video w-full rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                 <p className="text-xs text-muted-foreground text-center px-4 italic">No image selected</p>
               </div>
             )}
             <div className="flex items-center gap-3 pt-2 bg-accent/5 p-3 rounded-lg border border-accent/10">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={form.is_featured}
                  onChange={(e) => setField('is_featured', e.target.checked)}
                  className="rounded border-gray-300 text-accent focus:ring-accent h-4 w-4"
                />
                <Label htmlFor="is_featured" className="text-xs font-bold text-accent cursor-pointer">Feature on Homepage</Label>
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

