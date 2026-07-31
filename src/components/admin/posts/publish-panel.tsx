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
import { CalendarClockIcon, GlobeIcon, SaveIcon, SendIcon, UserIcon } from 'lucide-react'
import { formatScheduledPublishLabel } from '@/lib/admin/datetime-local'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StatusOption {
  value: string
  label: string
}

export interface PublishPanelProps {
  status: string
  /** datetime-local string (YYYY-MM-DDTHH:mm) */
  scheduledAt: string
  authorName: string
  isEditing: boolean
  submitting: boolean
  error: string | null
  onStatusChange: (status: string) => void
  onScheduledAtChange: (value: string) => void
  onPublish: () => void
  onSaveDraft: () => void
  customStatuses?: StatusOption[]
  /** Shown under the schedule picker (e.g. cron auto-publish note). */
  scheduleHint?: string
}

const DEFAULT_STATUSES: StatusOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
]

function primaryActionLabel(
  isEditing: boolean,
  status: string,
  submitting: boolean,
): string {
  if (submitting) return 'Saving…'
  if (status === 'scheduled') return isEditing ? 'Schedule publish' : 'Schedule'
  if (isEditing) return 'Update'
  return 'Publish'
}

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
  customStatuses,
  scheduleHint,
}: PublishPanelProps) {
  const statuses = customStatuses || DEFAULT_STATUSES
  const scheduledLabel = formatScheduledPublishLabel(scheduledAt)
  const scheduleMissing = status === 'scheduled' && !scheduledAt.trim()
  const minScheduleValue = React.useMemo(() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  }, [])

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Publish</h3>

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

      <div className="space-y-1.5">
        <Label htmlFor="publish-status" className="text-xs font-medium">
          Status
        </Label>
        <Select value={status} onValueChange={onStatusChange} disabled={submitting}>
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

      {status === 'scheduled' && (
        <div className="space-y-2 rounded-lg border border-violet-500/25 bg-violet-500/5 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-violet-700 dark:text-violet-300">
            <CalendarClockIcon className="size-3.5 shrink-0" />
            Schedule auto-publish
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scheduled-at" className="text-xs font-medium">
              Publish date &amp; time
            </Label>
            <Input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              min={minScheduleValue}
              onChange={(e) => onScheduledAtChange(e.target.value)}
              disabled={submitting}
              className="h-8 text-sm"
            />
          </div>
          {scheduledLabel ? (
            <p className="text-xs text-muted-foreground">
              Goes live <span className="font-medium text-foreground">{scheduledLabel}</span>
            </p>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Pick when this should publish automatically.
            </p>
          )}
          {scheduleHint ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">{scheduleHint}</p>
          ) : null}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          disabled={submitting || scheduleMissing}
          onClick={onPublish}
          className="w-full"
        >
          <SendIcon className="size-3.5" />
          {primaryActionLabel(isEditing, status, submitting)}
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
