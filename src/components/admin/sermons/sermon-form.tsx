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
import { AILinkProcessor } from '@/components/admin/sermons/ai-link-processor'
import { DraftReviewModal, type SermonFormData } from '@/components/admin/sermons/draft-review-modal'
import { createSermon, updateSermon } from '@/lib/actions/sermons'
import { validateVideoUrl } from '@/lib/utils'
import { isAIProcessorEnabled } from '@/lib/env'
import type { Sermon, SermonDraft } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SermonFormProps {
  /** When provided, the form is in edit mode */
  sermon?: Sermon
  onSuccess: () => void
  onCancel: () => void
}

interface FormState {
  title: string
  slug: string
  description: string
  content: string
  video_url: string
  audio_url: string
  thumbnail_url: string
  preacher: string
  series: string
  date: string
  duration_minutes: string
  status: 'draft' | 'published' | 'scheduled'
}

// ---------------------------------------------------------------------------
// SermonForm
// ---------------------------------------------------------------------------

export function SermonForm({ sermon, onSuccess, onCancel }: SermonFormProps) {
  const isEditing = Boolean(sermon)

  const [form, setForm] = React.useState<FormState>({
    title: sermon?.title ?? '',
    slug: sermon?.slug ?? '',
    description: sermon?.description ?? '',
    content: sermon?.content ?? '',
    video_url: sermon?.video_url ?? '',
    audio_url: sermon?.audio_url ?? '',
    thumbnail_url: sermon?.thumbnail_url ?? '',
    preacher: sermon?.preacher ?? '',
    series: sermon?.series ?? '',
    date: sermon?.date ?? '',
    duration_minutes: sermon?.duration_minutes != null ? String(sermon.duration_minutes) : '',
    status:
      sermon && (sermon.status === 'published' || sermon.status === 'scheduled' || sermon.status === 'draft')
        ? sermon.status
        : 'draft',
  })

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [videoUrlError, setVideoUrlError] = React.useState<string | null>(null)
  
  // Draft Review Modal state
  const [draftReviewOpen, setDraftReviewOpen] = React.useState(false)
  const [currentDraft, setCurrentDraft] = React.useState<SermonDraft | null>(null)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
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

    const payload = {
      title: data.title.trim(),
      slug: data.slug.trim(),
      description: data.description.trim() || undefined,
      content: data.content || undefined,
      video_url: data.video_url.trim() || undefined,
      audio_url: data.audio_url.trim() || undefined,
      thumbnail_url: data.thumbnail_url || undefined,
      preacher: data.preacher.trim(),
      series: data.series.trim() || undefined,
      date: data.date,
      duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : undefined,
      status,
    }

    const result = await createSermon(payload)

    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      throw new Error(result.error)
    }

    // Close modal and trigger success callback
    setDraftReviewOpen(false)
    setCurrentDraft(null)
    onSuccess()
  }

  /**
   * Handle close of Draft Review Modal
   */
  function handleDraftClose() {
    setDraftReviewOpen(false)
    setCurrentDraft(null)
  }

  function handleVideoUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const url = e.target.value
    setField('video_url', url)
    if (url.trim() === '') {
      setVideoUrlError(null)
    } else if (validateVideoUrl(url) === 'invalid') {
      setVideoUrlError('Please enter a valid YouTube, Vimeo, or direct video URL (.mp4, .webm, .ogg)')
    } else {
      setVideoUrlError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Block submission if video URL is invalid
    if (videoUrlError) return

    setSubmitting(true)

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      content: form.content || undefined,
      video_url: form.video_url.trim() || undefined,
      audio_url: form.audio_url.trim() || undefined,
      thumbnail_url: form.thumbnail_url || undefined,
      preacher: form.preacher.trim(),
      series: form.series.trim() || undefined,
      date: form.date,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
      status: form.status,
    }

    const result = isEditing
      ? await updateSermon(sermon!.id, payload)
      : await createSermon(payload)

    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    onSuccess()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-4 space-y-5">
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
      <div className="space-y-1.5">
        <Label htmlFor="sermon-title">Title</Label>
        <Input
          id="sermon-title"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Sermon title"
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

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="sermon-description">Description</Label>
        <Textarea
          id="sermon-description"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
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
          placeholder="Write sermon notes or transcript here…"
          disabled={submitting}
        />
      </div>

      {/* Video URL */}
      <div className="space-y-1.5">
        <Label htmlFor="sermon-video-url">Video URL</Label>
        <Input
          id="sermon-video-url"
          type="url"
          value={form.video_url}
          onChange={handleVideoUrlChange}
          placeholder="https://youtube.com/watch?v=… or https://vimeo.com/…"
          disabled={submitting}
        />
        {videoUrlError && (
          <p role="alert" className="text-xs text-destructive">
            {videoUrlError}
          </p>
        )}
      </div>

      {/* Audio URL */}
      <div className="space-y-1.5">
        <Label htmlFor="sermon-audio-url">Audio URL</Label>
        <Input
          id="sermon-audio-url"
          type="url"
          value={form.audio_url}
          onChange={(e) => setField('audio_url', e.target.value)}
          placeholder="https://example.com/sermon.mp3"
          disabled={submitting}
        />
      </div>

      {/* Thumbnail */}
      <div className="space-y-1.5">
        <Label>Thumbnail</Label>
        <MediaPicker
          value={form.thumbnail_url || undefined}
          onSelect={(url) => setField('thumbnail_url', url)}
          label="Select Image"
          accept="image"
        />
      </div>

      {/* Preacher + Series row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sermon-preacher">Preacher</Label>
          <Input
            id="sermon-preacher"
            value={form.preacher}
            onChange={(e) => setField('preacher', e.target.value)}
            placeholder="Preacher name"
            required
            disabled={submitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sermon-series">Series</Label>
          <Input
            id="sermon-series"
            value={form.series}
            onChange={(e) => setField('series', e.target.value)}
            placeholder="Series name (optional)"
            disabled={submitting}
          />
        </div>
      </div>

      {/* Date + Duration row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sermon-date">Date</Label>
          <Input
            id="sermon-date"
            type="date"
            value={form.date}
            onChange={(e) => setField('date', e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sermon-duration">Duration (minutes)</Label>
          <Input
            id="sermon-duration"
            type="number"
            min={1}
            value={form.duration_minutes}
            onChange={(e) => setField('duration_minutes', e.target.value)}
            placeholder="e.g. 45"
            disabled={submitting}
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <Label htmlFor="sermon-status">Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setField('status', v as 'draft' | 'published' | 'scheduled')}
          disabled={submitting}
        >
          <SelectTrigger id="sermon-status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
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
        <Button type="submit" size="sm" disabled={submitting || Boolean(videoUrlError)}>
          {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Sermon'}
        </Button>
      </div>
    </form>

    {/* Draft Review Modal */}
    {currentDraft && (
      <DraftReviewModal
        draft={currentDraft}
        isOpen={draftReviewOpen}
        onClose={handleDraftClose}
        onSave={handleDraftSave}
      />
    )}
  </>
  )
}
