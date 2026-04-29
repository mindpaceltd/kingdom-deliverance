'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SlugInput } from '@/components/admin/slug-input'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { MediaPicker } from '@/components/admin/media-picker'
import { createMinistry, updateMinistry } from '@/lib/actions/ministries'
import type { Ministry } from '@/lib/types'

interface MinistryFormProps {
  ministry?: Ministry
  onSuccess: () => void
  onCancel: () => void
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
  display_order: number
  is_active: boolean
}

export function MinistryForm({ ministry, onSuccess, onCancel }: MinistryFormProps) {
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
    display_order: ministry?.display_order ?? 0,
    is_active: ministry?.is_active ?? true,
  })

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      content: form.content || undefined,
      leader: form.leader.trim() || undefined,
      meeting_time: form.meeting_time.trim() || undefined,
      image_url: form.image_url || undefined,
      icon: form.icon.trim() || undefined,
      display_order: form.display_order,
      is_active: form.is_active,
    }

    const result = isEditing
      ? await updateMinistry(ministry!.id, payload)
      : await createMinistry(payload)

    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="ministry-name">Name</Label>
        <Input
          id="ministry-name"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="Ministry name"
          required
          disabled={submitting}
        />
      </div>

      {/* Slug */}
      <SlugInput
        title={form.name}
        value={form.slug}
        onChange={(slug) => setField('slug', slug)}
        disabled={submitting}
      />

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="ministry-description">Description</Label>
        <Textarea
          id="ministry-description"
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
          placeholder="Full ministry details, vision, activities…"
          disabled={submitting}
        />
      </div>

      {/* Leader */}
      <div className="space-y-1.5">
        <Label htmlFor="ministry-leader">Leader</Label>
        <Input
          id="ministry-leader"
          value={form.leader}
          onChange={(e) => setField('leader', e.target.value)}
          placeholder="e.g. Pastor John Doe"
          disabled={submitting}
        />
      </div>

      {/* Meeting time */}
      <div className="space-y-1.5">
        <Label htmlFor="ministry-meeting-time">Meeting Time</Label>
        <Input
          id="ministry-meeting-time"
          value={form.meeting_time}
          onChange={(e) => setField('meeting_time', e.target.value)}
          placeholder="e.g. Sundays at 3pm"
          disabled={submitting}
        />
      </div>

      {/* Image */}
      <div className="space-y-1.5">
        <Label>Image</Label>
        <MediaPicker
          value={form.image_url || undefined}
          onSelect={(url) => setField('image_url', url)}
          label="Select Image"
          accept="image"
        />
      </div>

      {/* Icon */}
      <div className="space-y-1.5">
        <Label htmlFor="ministry-icon">Icon Name</Label>
        <Input
          id="ministry-icon"
          value={form.icon}
          onChange={(e) => setField('icon', e.target.value)}
          placeholder="e.g. heart, users, music"
          disabled={submitting}
        />
      </div>

      {/* Display order */}
      <div className="space-y-1.5">
        <Label htmlFor="ministry-display-order">Display Order</Label>
        <Input
          id="ministry-display-order"
          type="number"
          min={0}
          value={form.display_order}
          onChange={(e) => setField('display_order', Number(e.target.value))}
          disabled={submitting}
        />
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-2">
        <input
          id="ministry-active"
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setField('is_active', e.target.checked)}
          disabled={submitting}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="ministry-active" className="cursor-pointer">
          Active
        </Label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

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
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Ministry'}
        </Button>
      </div>
    </form>
  )
}
