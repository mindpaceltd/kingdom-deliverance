'use client'

/**
 * Job Status Dashboard Page
 *
 * Displays all sermon processing jobs for the current user with real-time
 * status updates via polling. Supports filtering by status and sorting by
 * submission date (newest first).
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  RefreshCwIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  AlertCircleIcon,
  ExternalLinkIcon,
  XIcon,
  RotateCcwIcon,
  EyeIcon,
  VideoIcon,
  ListIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getUserJobs, cancelJob, processSermonLink } from '@/lib/actions/sermon-queue-processor'
import type { JobInfo, JobStatus } from '@/lib/types/queue-processor'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type FilterOption = 'all' | 'waiting' | 'active' | 'completed' | 'failed'

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateStr
  }
}

function truncateUrl(url: string, maxLength = 60): string {
  if (url.length <= maxLength) return url
  return url.slice(0, maxLength - 3) + '...'
}

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

interface StatusConfig {
  label: string
  className: string
  icon: React.ElementType
  dotColor: string
}

const statusConfig: Record<string, StatusConfig> = {
  waiting: {
    label: 'Waiting',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: ClockIcon,
    dotColor: 'bg-gray-400',
  },
  active: {
    label: 'Active',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Loader2Icon,
    dotColor: 'bg-blue-500',
  },
  extracting_audio: {
    label: 'Extracting Audio',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Loader2Icon,
    dotColor: 'bg-blue-500',
  },
  transcribing: {
    label: 'Transcribing',
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    icon: Loader2Icon,
    dotColor: 'bg-indigo-500',
  },
  summarizing: {
    label: 'Summarizing',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    icon: Loader2Icon,
    dotColor: 'bg-violet-500',
  },
  generating_seo: {
    label: 'Generating SEO',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: Loader2Icon,
    dotColor: 'bg-purple-500',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle2Icon,
    dotColor: 'bg-green-500',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircleIcon,
    dotColor: 'bg-red-500',
  },
  stalled: {
    label: 'Stalled',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    icon: AlertCircleIcon,
    dotColor: 'bg-orange-500',
  },
}

function JobStatusBadge({ status }: { status: JobStatus }) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
    icon: ClockIcon,
    dotColor: 'bg-muted-foreground',
  }
  const Icon = config.icon
  const isSpinning = ['active', 'extracting_audio', 'transcribing', 'summarizing', 'generating_seo'].includes(status)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.className
      )}
    >
      <Icon className={cn('size-3', isSpinning && 'animate-spin')} aria-hidden="true" />
      {config.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function ProgressBar({ progress, status }: { progress: number; status: JobStatus }) {
  const isActive = ['active', 'extracting_audio', 'transcribing', 'summarizing', 'generating_seo'].includes(status)
  const isCompleted = status === 'completed'
  const isFailed = status === 'failed' || status === 'stalled'

  const barColor = isFailed
    ? 'bg-red-500'
    : isCompleted
    ? 'bg-green-500'
    : 'bg-blue-500'

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div
        className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${progress}%`}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
        {progress}%
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

// ---------------------------------------------------------------------------
// Job table row (extracted to allow per-row button refs for focus management)
// ---------------------------------------------------------------------------

interface JobRowProps {
  job: JobInfo
  isJobActionLoading: boolean
  isWaiting: boolean
  isCompleted: boolean
  isFailed: boolean
  onViewDraft: (job: JobInfo) => void
  onRetry: (job: JobInfo, ref: React.RefObject<HTMLButtonElement>) => void
  onCancel: (job: JobInfo, ref: React.RefObject<HTMLButtonElement>) => void
}

function JobRow({
  job,
  isJobActionLoading,
  isWaiting,
  isCompleted,
  isFailed,
  onViewDraft,
  onRetry,
  onCancel,
}: JobRowProps) {
  // Per-row button refs for focus management after actions (Requirement 17.4)
  const retryBtnRef = React.useRef<HTMLButtonElement>(null)
  const cancelBtnRef = React.useRef<HTMLButtonElement>(null)

  return (
    <tr className="group hover:bg-muted/20 transition-colors">
      {/* Video URL */}
      <td className="px-4 py-3 max-w-[280px]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-muted/50 flex-shrink-0">
            <VideoIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <a
              href={job.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground/90 hover:text-primary transition-colors flex items-center gap-1 group/link"
              title={job.videoUrl}
            >
              <span className="truncate block max-w-[200px]">
                {truncateUrl(job.videoUrl)}
              </span>
              <ExternalLinkIcon
                className="size-3 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity"
                aria-hidden="true"
              />
            </a>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
              ID: {job.id.slice(0, 8)}…
            </p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <JobStatusBadge status={job.status} />
        {job.errorMessage && (
          <p
            className="text-[10px] text-red-600 mt-1 max-w-[180px] truncate"
            title={job.errorMessage}
          >
            {job.errorMessage}
          </p>
        )}
      </td>

      {/* Progress */}
      <td className="px-4 py-3">
        <ProgressBar progress={job.progress} status={job.status} />
      </td>

      {/* Submitted At */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-sm text-foreground/80">
          {formatDate(job.createdAt)}
        </span>
      </td>

      {/* Completed At */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-sm text-foreground/80">
          {formatDate(job.completedAt)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {/* View Draft — completed jobs only */}
          {isCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDraft(job)}
              disabled={isJobActionLoading}
              className="gap-1.5 h-8 px-2.5 text-xs hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-400"
              aria-label={`View draft for ${job.videoUrl}`}
            >
              <EyeIcon className="size-3.5" aria-hidden="true" />
              View Draft
            </Button>
          )}

          {/* Retry — failed/stalled jobs only */}
          {isFailed && (
            <Button
              ref={retryBtnRef}
              variant="ghost"
              size="sm"
              onClick={() => onRetry(job, retryBtnRef)}
              disabled={isJobActionLoading}
              className="gap-1.5 h-8 px-2.5 text-xs hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              aria-label={`Retry processing for ${job.videoUrl}`}
            >
              {isJobActionLoading ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <RotateCcwIcon className="size-3.5" aria-hidden="true" />
              )}
              Retry
            </Button>
          )}

          {/* Cancel — waiting jobs only */}
          {isWaiting && (
            <Button
              ref={cancelBtnRef}
              variant="ghost"
              size="sm"
              onClick={() => onCancel(job, cancelBtnRef)}
              disabled={isJobActionLoading}
              className="gap-1.5 h-8 px-2.5 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10"
              aria-label={`Cancel job for ${job.videoUrl}`}
            >
              {isJobActionLoading ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <XIcon className="size-3.5" aria-hidden="true" />
              )}
              Cancel
            </Button>
          )}

          {/* No actions for active/in-progress jobs */}
          {!isCompleted && !isFailed && !isWaiting && (
            <span className="text-xs text-muted-foreground px-2">Processing…</span>
          )}
        </div>
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function JobsDashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = React.useState<JobInfo[]>([])
  const [filter, setFilter] = React.useState<FilterOption>('all')
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [mounted, setMounted] = React.useState(false)
  // Screen reader announcement for status changes (Requirement 17.6)
  const [announcement, setAnnouncement] = React.useState<string>('')
  // Track previous job statuses to detect changes during polling
  const prevJobStatusesRef = React.useRef<Map<string, string>>(new Map())
  // Ref for focus management after actions (Requirement 17.2, 17.4)
  const actionFocusRef = React.useRef<HTMLButtonElement | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch jobs from server action
  const fetchJobs = React.useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsLoading(true)
      setError(null)
      try {
        const result = await getUserJobs(filter)
        if (result.error) {
          setError(result.error)
        } else if (result.jobs) {
          // Sort by createdAt descending (newest first)
          const sorted = [...result.jobs].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )

          // Detect status changes for screen reader announcements (Requirement 17.6)
          const prevStatuses = prevJobStatusesRef.current
          const changedAnnouncements: string[] = []
          for (const job of sorted) {
            const prevStatus = prevStatuses.get(job.id)
            if (prevStatus && prevStatus !== job.status) {
              const config = statusConfig[job.status]
              const label = config?.label ?? job.status
              const shortUrl = truncateUrl(job.videoUrl, 40)
              changedAnnouncements.push(`Job for ${shortUrl}: status changed to ${label}`)
            }
          }
          if (changedAnnouncements.length > 0) {
            setAnnouncement(changedAnnouncements.join('. '))
          }

          // Update tracked statuses
          const newStatuses = new Map<string, string>()
          for (const job of sorted) {
            newStatuses.set(job.id, job.status)
          }
          prevJobStatusesRef.current = newStatuses

          setJobs(sorted)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
      } finally {
        if (showLoading) setIsLoading(false)
      }
    },
    [filter]
  )

  // Initial load
  React.useEffect(() => {
    fetchJobs(true)
  }, [fetchJobs])

  // Poll every 5 seconds while there are active/waiting jobs
  React.useEffect(() => {
    const hasActiveJobs = jobs.some((j) =>
      ['waiting', 'active', 'extracting_audio', 'transcribing', 'summarizing', 'generating_seo'].includes(j.status)
    )

    if (!hasActiveJobs) return

    const interval = setInterval(() => {
      fetchJobs(false)
    }, 5000)

    return () => clearInterval(interval)
  }, [jobs, fetchJobs])

  // Handle cancel job
  async function handleCancel(job: JobInfo, buttonRef?: React.RefObject<HTMLButtonElement>) {
    if (!window.confirm(`Cancel processing for this video?\n${job.videoUrl}`)) return
    // Store the button ref for focus restoration after action (Requirement 17.4)
    if (buttonRef?.current) {
      actionFocusRef.current = buttonRef.current
    }
    setActionLoading(job.id)
    setActionError(null)
    try {
      const result = await cancelJob(job.id)
      if (result.error) {
        setActionError(result.error)
        // Restore focus to the button on error
        actionFocusRef.current?.focus()
      } else {
        await fetchJobs(false)
        // After cancel, the row disappears; move focus to the Refresh button
        // (handled via the announcement + natural tab order)
        setAnnouncement(`Job for ${truncateUrl(job.videoUrl, 40)} has been cancelled.`)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel job')
      actionFocusRef.current?.focus()
    } finally {
      setActionLoading(null)
    }
  }

  // Handle retry job (create new job with same URL)
  async function handleRetry(job: JobInfo, buttonRef?: React.RefObject<HTMLButtonElement>) {
    // Store the button ref for focus restoration after action (Requirement 17.4)
    if (buttonRef?.current) {
      actionFocusRef.current = buttonRef.current
    }
    setActionLoading(job.id)
    setActionError(null)
    try {
      const result = await processSermonLink(job.videoUrl)
      if (result.error) {
        setActionError(result.error)
        actionFocusRef.current?.focus()
      } else {
        await fetchJobs(false)
        setAnnouncement(`Retry started for ${truncateUrl(job.videoUrl, 40)}.`)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to retry job')
      actionFocusRef.current?.focus()
    } finally {
      setActionLoading(null)
    }
  }

  // Handle view draft — navigate to sermon form with job ID
  function handleViewDraft(job: JobInfo) {
    router.push(`/admin/sermons/new?jobId=${job.id}`)
  }

  // Counts per status for filter badges
  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: jobs.length }
    for (const job of jobs) {
      const bucket = ['active', 'extracting_audio', 'transcribing', 'summarizing', 'generating_seo'].includes(job.status)
        ? 'active'
        : job.status
      c[bucket] = (c[bucket] ?? 0) + 1
    }
    return c
  }, [jobs])

  if (!mounted) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 w-full bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Screen reader live region for status change announcements (Requirements 17.6, 17.2) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Processing Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track the status of your sermon video processing jobs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchJobs(true)}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCwIcon className={cn('size-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/admin/sermons/new')}
            className="gap-2"
          >
            <VideoIcon className="size-4" />
            New Job
          </Button>
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div
          className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div
          className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-sm text-destructive">{actionError}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div
        className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 w-fit"
        role="tablist"
        aria-label="Filter jobs by status"
      >
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            role="tab"
            aria-selected={filter === opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
              filter === opt.value
                ? 'bg-background text-foreground shadow-sm border border-border/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            {opt.label}
            {counts[opt.value] !== undefined && counts[opt.value] > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full text-[10px] font-semibold min-w-[18px] h-[18px] px-1',
                  filter === opt.value
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {counts[opt.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2Icon className="size-8 animate-spin" />
              <p className="text-sm">Loading jobs...</p>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <div className="p-4 rounded-full bg-muted/50">
              <ListIcon className="size-8 opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">No jobs found</p>
              <p className="text-xs mt-1">
                {filter === 'all'
                  ? 'Submit a video URL to start processing.'
                  : `No ${filter} jobs at the moment.`}
              </p>
            </div>
            {filter !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setFilter('all')}>
                View all jobs
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Processing jobs">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Video URL
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Progress
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Submitted At
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Completed At
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {jobs.map((job) => {
                  const isJobActionLoading = actionLoading === job.id
                  const isWaiting = job.status === 'waiting'
                  const isCompleted = job.status === 'completed'
                  const isFailed = job.status === 'failed' || job.status === 'stalled'

                  return (
                    <JobRow
                      key={job.id}
                      job={job}
                      isJobActionLoading={isJobActionLoading}
                      isWaiting={isWaiting}
                      isCompleted={isCompleted}
                      isFailed={isFailed}
                      onViewDraft={handleViewDraft}
                      onRetry={handleRetry}
                      onCancel={handleCancel}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with job count */}
        {!isLoading && jobs.length > 0 && (
          <div className="px-4 py-3 border-t border-border/30 bg-muted/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
              {filter !== 'all' && ` with status: ${filter}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Auto-refreshes every 5 seconds while jobs are active
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
