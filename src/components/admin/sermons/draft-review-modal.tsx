'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { SermonDraft } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DraftReviewModalProps {
  draft: SermonDraft
  isOpen: boolean
  onClose: () => void
  onSave: (data: SermonFormData, status: 'draft' | 'published') => Promise<void>
}

export interface SermonFormData {
  title: string
  slug: string
  description: string
  content: string
  keywords: string
  video_url: string
  audio_url: string
  thumbnail_url: string
  preacher: string
  series: string
  date: string
  duration_minutes: string
  status: 'draft' | 'published'
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function draftToFormData(draft: SermonDraft): SermonFormData {
  // Generate slug from title
  const slug = draft.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  return {
    title: draft.title,
    slug,
    description: draft.description,
    content: draft.content,
    keywords: draft.keywords.join(', '),
    video_url: draft.video_url,
    audio_url: '',
    thumbnail_url: '',
    preacher: '',
    series: '',
    date: today,
    duration_minutes: '',
    status: 'draft',
  }
}

// ---------------------------------------------------------------------------
// DraftReviewModal Component
// ---------------------------------------------------------------------------

export function DraftReviewModal({
  draft,
  isOpen,
  onClose,
  onSave,
}: DraftReviewModalProps) {
  const [formData, setFormData] = React.useState<SermonFormData>(
    draftToFormData(draft)
  )
  const [showTranscript, setShowTranscript] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)

  // Track if form has been modified
  React.useEffect(() => {
    const initialData = draftToFormData(draft)
    const changed = JSON.stringify(formData) !== JSON.stringify(initialData)
    setHasChanges(changed)
  }, [formData, draft])

  // Reset form when draft changes
  React.useEffect(() => {
    if (isOpen) {
      setFormData(draftToFormData(draft))
      setShowTranscript(false)
      setHasChanges(false)
    }
  }, [draft, isOpen])

  function setField<K extends keyof SermonFormData>(
    key: K,
    value: SermonFormData[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(status: 'draft' | 'published') {
    setIsSaving(true)
    try {
      await onSave({ ...formData, status }, status)
      onClose()
    } catch (error) {
      console.error('Failed to save sermon:', error)
    } finally {
      setIsSaving(false)
    }
  }

  function handleClose() {
    if (hasChanges) {
      setShowDiscardDialog(true)
    } else {
      onClose()
    }
  }

  function handleDiscardConfirm() {
    setShowDiscardDialog(false)
    onClose()
  }

  function handleDiscardCancel() {
    setShowDiscardDialog(false)
  }

  // Focus management: focus first input when modal opens
  const titleInputRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (isOpen && titleInputRef.current) {
      // Delay focus to allow dialog animation to complete
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  return (
    <>
      {/* Main Draft Review Dialog */}
      <Dialog open={isOpen && !showDiscardDialog} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>Review AI-Generated Sermon</DialogTitle>
            <DialogDescription>
              Review and edit the AI-generated content below. All fields are
              editable before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="draft-title">Title</Label>
              <Input
                id="draft-title"
                ref={titleInputRef}
                value={formData.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Sermon title"
                required
                disabled={isSaving}
              />
            </div>

            {/* Slug */}
            <SlugInput
              title={formData.title}
              value={formData.slug}
              onChange={(slug) => setField('slug', slug)}
              disabled={isSaving}
            />

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="draft-description">Description</Label>
              <Textarea
                id="draft-description"
                value={formData.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Short summary shown in listings…"
                rows={3}
                disabled={isSaving}
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label>Content</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(html) => setField('content', html)}
                placeholder="Write sermon notes or transcript here…"
                disabled={isSaving}
              />
            </div>

            {/* Keywords */}
            <div className="space-y-1.5">
              <Label htmlFor="draft-keywords">Keywords</Label>
              <Input
                id="draft-keywords"
                value={formData.keywords}
                onChange={(e) => setField('keywords', e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated keywords for SEO
              </p>
            </div>

            {/* Video URL */}
            <div className="space-y-1.5">
              <Label htmlFor="draft-video-url">Video URL</Label>
              <Input
                id="draft-video-url"
                type="url"
                value={formData.video_url}
                onChange={(e) => setField('video_url', e.target.value)}
                placeholder="https://youtube.com/watch?v=…"
                disabled={isSaving}
              />
            </div>

            {/* Audio URL */}
            <div className="space-y-1.5">
              <Label htmlFor="draft-audio-url">Audio URL</Label>
              <Input
                id="draft-audio-url"
                type="url"
                value={formData.audio_url}
                onChange={(e) => setField('audio_url', e.target.value)}
                placeholder="https://example.com/sermon.mp3"
                disabled={isSaving}
              />
            </div>

            {/* Thumbnail */}
            <div className="space-y-1.5">
              <Label>Thumbnail</Label>
              <MediaPicker
                value={formData.thumbnail_url || undefined}
                onSelect={(url) => setField('thumbnail_url', url)}
                label="Select Image"
                accept="image"
              />
            </div>

            {/* Preacher + Series row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="draft-preacher">Preacher</Label>
                <Input
                  id="draft-preacher"
                  value={formData.preacher}
                  onChange={(e) => setField('preacher', e.target.value)}
                  placeholder="Preacher name"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="draft-series">Series</Label>
                <Input
                  id="draft-series"
                  value={formData.series}
                  onChange={(e) => setField('series', e.target.value)}
                  placeholder="Series name (optional)"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Date + Duration row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="draft-date">Date</Label>
                <Input
                  id="draft-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setField('date', e.target.value)}
                  required
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="draft-duration">Duration (minutes)</Label>
                <Input
                  id="draft-duration"
                  type="number"
                  min={1}
                  value={formData.duration_minutes}
                  onChange={(e) => setField('duration_minutes', e.target.value)}
                  placeholder="e.g. 45"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="draft-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setField('status', v as 'draft' | 'published')
                }
                disabled={isSaving}
              >
                <SelectTrigger id="draft-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Collapsible Transcript Viewer */}
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex w-full items-center justify-between text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                aria-expanded={showTranscript}
                aria-controls="transcript-content"
              >
                <span>Full Transcript</span>
                {showTranscript ? (
                  <ChevronUp className="size-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="size-4" aria-hidden="true" />
                )}
              </button>
              {showTranscript && (
                <div
                  id="transcript-content"
                  className="mt-2 max-h-60 overflow-y-auto rounded border border-border bg-background p-3 text-sm"
                  role="region"
                  aria-label="Video transcript"
                >
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {draft.transcript}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSave('draft')}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save as Draft'}
            </Button>
            <Button
              type="button"
              onClick={() => handleSave('published')}
              disabled={isSaving}
            >
              {isSaving ? 'Publishing…' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard Changes Confirmation Dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscardCancel}
            >
              Keep Editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDiscardConfirm}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
