'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserIcon, GlobeIcon, SaveIcon, SendIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StatusOption {
  value: string
  label: string
}

export interface PublishPanelProps {
  status: string
  scheduledAt: string  // ISO string or ''
  authorName: string
  isEditing: boolean
  submitting: boolean
  error: string | null
  onStatusChange: (status: any) => void
  onScheduledAtChange: (value: string) => void
  onPublish: () => void
  onSaveDraft: () => void
  customStatuses?: StatusOption[]
}

const DEFAULT_STATUSES: StatusOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
]

// ---------------------------------------------------------------------------
// PublishPanel
// ---------------------------------------------------------------------------

export function PublishPanel({
  status,
  scheduledAt,
  authorName,
  isEditing,
  submitting,
  error,
  onStatusChange,
  onScheduledAtChange,
  onPublish,
  onSaveDraft,
  customStatuses
}: PublishPanelProps) {
  const statuses = customStatuses || DEFAULT_STATUSES

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Publish</h3>

      {/* Author + Visibility */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <UserIcon className="size-3.5 shrink-0" />
          <span>
            <span className="font-medium text-foreground">Author:</span>{' '}
            {authorName || 'Admin'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <GlobeIcon className="size-3.5 shrink-0" />
          <span>
            <span className="font-medium text-foreground">Visibility:</span>{' '}
            Public
          </span>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Status selector */}
      <div className="space-y-1.5">
        <Label htmlFor="publish-status" className="text-xs font-medium">
          Status
        </Label>
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v)}
          disabled={submitting}
        >
          <SelectTrigger id="publish-status" className="h-8 text-sm">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scheduled date/time picker — only shown when status = 'scheduled' */}
      {status === 'scheduled' && (
        <div className="space-y-1.5">
          <Label htmlFor="scheduled-at" className="text-xs font-medium">
            Publish Date &amp; Time
          </Label>
          <Input
            id="scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => onScheduledAtChange(e.target.value)}
            disabled={submitting}
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* Inline error */}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          disabled={submitting}
          onClick={onPublish}
          className="w-full"
        >
          <SendIcon className="size-3.5" />
          {submitting
            ? 'Saving…'
            : isEditing
            ? 'Update'
            : status === 'scheduled'
            ? 'Schedule'
            : 'Publish'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={submitting}
          onClick={onSaveDraft}
          className="w-full"
        >
          <SaveIcon className="size-3.5" />
          Save Draft
        </Button>
      </div>
    </div>
  )
}

