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
import { createMinistry, updateMinistry, checkSlugAvailability } from '@/lib/actions/ministries'
import { generatePostContent } from '@/lib/actions/ai'
import { applyAiSeoFields } from '@/lib/admin/apply-ai-seo'
import { reportIndexingToast } from '@/lib/admin/report-indexing-toast'
import { computeSeoScore } from '@/lib/seo-scorer'
import { getPublicIndexUrl } from '@/lib/seo/content-indexing'
import { submitGoogleIndexing } from '@/lib/seo/submit-google-indexing-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Ministry } from '@/lib/types'

interface MinistryEditorClientProps {
  ministry?: Ministry
}

interface FormState {
  name: string
  slug: string
  description: string
  content: string
  leader: string
  meeting_time: string
  image_url: string
  icon: string
  display_order: string
  is_active: boolean
  status: Ministry['status']
  scheduled_at: string
  meta_title: string
  meta_description: string
  focus_keyword: string
}

export function MinistryEditorClient({ ministry }: MinistryEditorClientProps) {
  const router = useRouter()
  const isEditing = Boolean(ministry)

  const [form, setForm] = React.useState<FormState>({
    name: ministry?.name ?? '',
    slug: ministry?.slug ?? '',
    description: ministry?.description ?? '',
    content: ministry?.content ?? '',
    leader: ministry?.leader ?? '',
    meeting_time: ministry?.meeting_time ?? '',
    image_url: ministry?.image_url ?? '',
    icon: ministry?.icon ?? '',
    display_order: ministry?.display_order ? String(ministry.display_order) : '0',
    is_active: ministry?.is_active ?? true,
    status: (ministry?.status as any) ?? 'draft',
    scheduled_at: ministry?.scheduled_at ?? '',
    meta_title: ministry?.meta_title ?? '',
    meta_description: ministry?.meta_description ?? '',
    focus_keyword: ministry?.focus_keyword ?? '',
  })

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [slugError, setSlugError] = React.useState<string | null>(null)
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiError, setAiError] = React.useState<string | null>(null)
  const [showAiMenu, setShowAiMenu] = React.useState(false)
  const [previewMode, setPreviewMode] = React.useState(false)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  async function handleSlugChange(slug: string) {
    setField('slug', slug)
    const result = await checkSlugAvailability(slug, ministry?.id)
    if (!result.available) setSlugError('Slug already taken')
    else setSlugError(null)
  }

  async function handleAiGenerate(mode: 'full' | 'improve') {
    setShowAiMenu(false)
    setAiError(null)
    if (!form.name.trim()) {
      setAiError('Enter a ministry name before using AI Assist.')
      return
    }
    if (mode === 'improve' && !form.content.trim()) {
      setAiError('No content to improve. Use Generate Details instead.')
      return
    }
    setAiLoading(true)
    const result = await generatePostContent({
      mode: mode === 'full' ? 'ministry_full' : 'ministry_improve',
      title: form.name,
      excerpt: form.description || undefined,
      existingContent: form.content || undefined,
      focusKeyword: form.focus_keyword || undefined,
    })
    setAiLoading(false)
    if ('error' in result) {
      setAiError(result.error)
      return
    }
    applyAiSeoFields(result, {
      setContent: (html) => setField('content', html),
      setSummary: (text) => setField('description', text),
      setFocusKeyword: (v) => setField('focus_keyword', v),
      setMetaTitle: (v) => setField('meta_title', v),
      setMetaDescription: (v) => setField('meta_description', v),
      setSlug: (v) => void handleSlugChange(v),
    })
    toast.success('AI updated ministry content and SEO fields.')
  }

  async function save(overrideStatus?: Ministry['status']) {
    setSubmitting(true)
    const effectiveStatus = overrideStatus ?? form.status
    const { score } = computeSeoScore({
      focusKeyword: form.focus_keyword,
      seoTitle: form.meta_title || form.name,
      metaDescription: form.meta_description,
      content: form.content,
      slug: form.slug,
      featuredImage: form.image_url,
    })

    const payload = {
      ...form,
      display_order: Number(form.display_order),
      status: effectiveStatus as any,
      seo_score: score,
    }

    const result = isEditing
      ? await updateMinistry(ministry!.id, payload)
      : await createMinistry(payload)

    setSubmitting(false)
    if ('error' in result) {
      setError(result.error)
      return false
    }

    if (effectiveStatus === 'published' && form.slug.trim()) {
      const indexResult = await submitGoogleIndexing([
        getPublicIndexUrl('ministry', form.slug),
      ])
      reportIndexingToast(indexResult)
    }

    return true
  }

  async function handlePublish() {
    if (await save('published')) router.push('/admin/ministries')
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
          onClick={() => router.push('/admin/ministries')}
          className="gap-1.5"
        >
          <ArrowLeftIcon className="size-4" />
          Ministries
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {isEditing ? 'Editing ministry' : 'New ministry'}
        </span>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <Input
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Ministry Name"
              required
              className="text-2xl font-bold h-auto py-3 border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-ring placeholder:text-muted-foreground/50"
            />

            <SlugInput
              title={form.name}
              value={form.slug}
              onChange={handleSlugChange}
              disabled={submitting}
            />
            {slugError && <p className="text-xs text-destructive -mt-4">{slugError}</p>}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Ministry Leader</Label>
                <Input
                  value={form.leader}
                  onChange={(e) => setField('leader', e.target.value)}
                  placeholder="e.g. Pastor John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Meeting Time</Label>
                <Input
                  value={form.meeting_time}
                  onChange={(e) => setField('meeting_time', e.target.value)}
                  placeholder="e.g. Every Saturday 5PM"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setField('display_order', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-sm font-medium">Icon Identifier (optional)</Label>
                 <Input
                  value={form.icon}
                  onChange={(e) => setField('icon', e.target.value)}
                  placeholder="e.g. users, heart, cross"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Short Summary</Label>
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
                <Label className="text-sm font-medium">Full Ministry Details</Label>
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

              {aiError && (
                <p className="text-xs text-destructive">{aiError}</p>
              )}

              {previewMode ? (
                <div className="rounded-md border border-input bg-background px-4 py-3 min-h-[320px]">
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: form.content }} />
                </div>
              ) : (
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setField('content', html)}
                  placeholder="Write detailed about the ministry here..."
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
             <h3 className="text-sm font-semibold">Ministry Header Image</h3>
             <MediaPicker
                value={form.image_url}
                onSelect={(url) => setField('image_url', url)}
                label="Select Banner"
                accept="image"
             />
             <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setField('is_active', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <Label htmlFor="is_active" className="text-xs cursor-pointer">Mark as Active</Label>
             </div>
          </div>

          <SeoPanel
            focusKeyword={form.focus_keyword}
            seoTitle={form.meta_title || form.name}
            metaDescription={form.meta_description}
            content={form.content}
            slug={form.slug}
            featuredImage={form.image_url}
            publicUrl={`https://kdcuganda.org/ministries/${form.slug || ''}`}
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
