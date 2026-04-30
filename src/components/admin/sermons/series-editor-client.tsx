'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SlugInput } from '@/components/admin/slug-input'
import { MediaPicker } from '../media-picker'
import { SeoPanel } from '../posts/seo-panel'
import { createSermonSeries, updateSermonSeries } from '@/lib/actions/sermon-series'
import { checkSlugAvailability } from '@/lib/actions/sermons' // Can reuse slug check
import { computeSeoScore } from '@/lib/seo-scorer'
import type { SermonSeries } from '@/lib/types'

interface SeriesEditorClientProps {
  series?: SermonSeries
}

export function SeriesEditorClient({ series }: SeriesEditorClientProps) {
  const router = useRouter()
  const isEditing = Boolean(series)

  const [form, setForm] = React.useState({
    name: series?.name ?? '',
    slug: series?.slug ?? '',
    description: series?.description ?? '',
    image_url: series?.image_url ?? '',
    meta_title: series?.meta_title ?? '',
    meta_description: series?.meta_description ?? '',
    focus_keyword: series?.focus_keyword ?? '',
  })

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  async function handleSave() {
    setSubmitting(true)
    setError(null)

    const { score } = computeSeoScore({
      focusKeyword: form.focus_keyword,
      seoTitle: form.meta_title || form.name,
      metaDescription: form.meta_description,
      content: form.description,
      slug: form.slug,
      featuredImage: form.image_url,
    })

    const payload = {
      ...form,
      seo_score: score,
    }

    const result = isEditing
      ? await updateSermonSeries(series!.id, payload)
      : await createSermonSeries(payload)

    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
    } else {
      router.push('/admin/sermons/series')
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden -m-6">
      {/* Top bar */}
      <div className="shrink-0 sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/sermons/series')}
          className="gap-1.5"
        >
          <ArrowLeftIcon className="size-4" />
          Series List
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {isEditing ? 'Editing series' : 'New series'}
        </span>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <Input
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Series Name"
              required
              className="text-2xl font-bold h-auto py-3 border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-ring placeholder:text-muted-foreground/50"
            />

            <SlugInput
              title={form.name}
              value={form.slug}
              onChange={(v) => setField('slug', v)}
              disabled={submitting}
            />

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="What is this series about?"
                rows={5}
              />
            </div>
          </div>
        </main>

        <aside className="w-80 shrink-0 border-l border-border overflow-y-auto px-4 py-6 space-y-6">
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <h3 className="text-sm font-semibold">Publish</h3>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleSave} disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Update Series' : 'Create Series'}
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
             <h3 className="text-sm font-semibold">Series Image</h3>
             <MediaPicker
                value={form.image_url}
                onSelect={(url) => setField('image_url', url)}
                label="Select Image"
                accept="image"
             />
          </div>

          <SeoPanel
            focusKeyword={form.focus_keyword}
            seoTitle={form.meta_title || form.name}
            metaDescription={form.meta_description}
            content={form.description}
            slug={form.slug}
            featuredImage={form.image_url}
            publicUrl={`https://kdcuganda.org/sermons/series/${form.slug || ''}`}
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
