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
import { createEvent, updateEvent } from '@/lib/actions/events'
import type { Event } from '@/lib/types'

interface EventFormProps {
  event?: Event
  onSuccess: () => void
  onCancel: () => void
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
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const isEditing = Boolean(event)

  const [form, setForm] = React.useState<FormState>({
    title: event?.title ?? '',
    slug: event?.slug ?? '',
    description: event?.description ?? '',
    content: event?.content ?? '',
    date: toDatetimeLocal(event?.date),
    end_date: toDatetimeLocal(event?.end_date),
    location: event?.location ?? '',
    image_url: event?.image_url ?? '',
    is_featured: event?.is_featured ?? false,
    registration_url: event?.registration_url ?? '',
    status: event?.status ?? 'upcoming',
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
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      content: form.content || undefined,
      date: form.date,
      end_date: form.end_date || undefined,
      location: form.location.trim() || undefined,
      image_url: form.image_url || undefined,
      is_featured: form.is_featured,
      registration_url: form.registration_url.trim() || undefined,
      status: form.status,
    }

    const result = isEditing
      ? await updateEvent(event!.id, payload)
      : await createEvent(payload)

    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="event-title">Title</Label>
        <Input
          id="event-title"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Event title"
          required
          disabled={submitting}
        />
      </div>

      <SlugInput
        title={form.title}
        value={form.slug}
        onChange={(slug) => setField('slug', slug)}
        disabled={submitting}
      />

      <div className="space-y-1.5">
        <Label htmlFor="event-description">Description</Label>
        <Textarea
          id="event-description"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Short summary shown in listings…"
          rows={3}
          disabled={submitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Content</Label>
        <RichTextEditor
          value={form.content}
          onChange={(html) => setField('content', html)}
          placeholder="Full event details, schedule, speakers…"
          disabled={submitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="event-date">Start Date &amp; Time</Label>
          <Input
            id="event-date"
            type="datetime-local"
            value={form.date}
            onChange={(e) => setField('date', e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event-end-date">End Date &amp; Time (optional)</Label>
          <Input
            id="event-end-date"
            type="datetime-local"
            value={form.end_date}
            onChange={(e) => setField('end_date', e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-location">Location</Label>
        <Input
          id="event-location"
          value={form.location}
          onChange={(e) => setField('location', e.target.value)}
          placeholder="Venue or address"
          disabled={submitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Image</Label>
        <MediaPicker
          value={form.image_url || undefined}
          onSelect={(url) => setField('image_url', url)}
          label="Select Image"
          accept="image"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="event-featured"
          type="checkbox"
          checked={form.is_featured}
          onChange={(e) => setField('is_featured', e.target.checked)}
          disabled={submitting}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="event-featured" className="cursor-pointer">
          Featured event
        </Label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-registration-url">Registration URL (optional)</Label>
        <Input
          id="event-registration-url"
          type="url"
          value={form.registration_url}
          onChange={(e) => setField('registration_url', e.target.value)}
          placeholder="https://example.com/register"
          disabled={submitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-status">Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setField('status', v as Event['status'])}
          disabled={submitting}
        >
          <SelectTrigger id="event-status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="past">Past</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
}
