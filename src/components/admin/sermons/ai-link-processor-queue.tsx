'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { processSermonLink, getJobStatus, getJobDraft } from '@/lib/actions/sermon-queue-processor'
import type { SermonDraft, JobProgress } from '@/lib/types/queue-processor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AILinkProcessorQueueProps {
  /** Callback invoked when draft is successfully generated */
  onDraftGenerated: (draft: SermonDraft) => void
}

// ---------------------------------------------------------------------------
// AILinkProcessorQueue
// ---------------------------------------------------------------------------

/**
 * Queue-based AI Link Processor Component
 * 
 * Allows users to submit video URLs for asynchronous processing.
 * Displays job ID and success message after submission.
 * Polls job status every 2 seconds and displays progress.
 * 
 * Requirements: 11.1, 11.2, 6.2, 6.3, 6.4, 6.5
 */
export function AILinkProcessorQueue({ onDraftGenerated }: AILinkProcessorQueueProps) {
  const [linkUrl, setLinkUrl] = React.useState('')
  const [jobId, setJobId] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'submitted' | 'processing'>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState<JobProgress | null>(null)

  // Client-side URL validation: disable button if empty or whitespace
  const isLinkValid = linkUrl.trim().length > 0
  const isButtonDisabled = !isLinkValid || isProcessing

  /**
   * Poll job status every 2 seconds while processing
   * Updates progress state and stops when job completes or fails
   * 
   * Requirements: 6.2, 6.3, 6.4, 6.5
   */
  React.useEffect(() => {
    // Only poll if we have a jobId and status is submitted or processing
    if (!jobId || (status !== 'submitted' && status !== 'processing')) {
      return
    }

    // Start polling immediately
    const pollStatus = async () => {
      try {
        const result = await getJobStatus(jobId)

        // Handle error response
        if ('error' in result && result.error) {
          setError(result.error)
          setStatus('idle')
          setIsProcessing(false)
          return
        }

        // Update progress state
        if (result.success && result.status) {
          setProgress(result.status)
          setStatus('processing')

          // Check if job completed successfully
          if (result.status.status === 'completed') {
            setIsProcessing(false)
            
            // Fetch the completed draft
            const draftResult = await getJobDraft(jobId)
            if (draftResult.success && draftResult.draft) {
              onDraftGenerated(draftResult.draft)
              // Reset component state
              setLinkUrl('')
              setJobId(null)
              setStatus('idle')
              setProgress(null)
            } else {
              setError(draftResult.error || 'Failed to fetch draft')
              setStatus('idle')
            }
          }

          // Check if job failed
          if (result.status.status === 'failed') {
            setIsProcessing(false)
            setError('Processing failed. Please try again or enter content manually.')
            setStatus('idle')
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch job status'
        )
        setIsProcessing(false)
        setStatus('idle')
      }
    }

    // Poll immediately on mount
    pollStatus()

    // Set up polling interval (every 2 seconds)
    const interval = setInterval(pollStatus, 2000)

    // Cleanup interval on unmount or when dependencies change
    return () => clearInterval(interval)
  }, [jobId, status, onDraftGenerated])

  /**
   * Handle Process Video button click
   * Calls processSermonLink server action and displays job ID
   * 
   * Requirements: 11.2
   */
  async function handleProcessVideo() {
    if (!isLinkValid) return

    // Clear previous state
    setError(null)
    setJobId(null)
    setProgress(null)
    setIsProcessing(true)
    setStatus('submitting')

    try {
      // Call server action to enqueue job
      const result = await processSermonLink(linkUrl.trim())

      // Handle error response
      if ('error' in result && result.error) {
        setError(result.error)
        setStatus('idle')
        setIsProcessing(false)
        return
      }

      // Handle success response
      if (result.success && result.jobId) {
        setJobId(result.jobId)
        setStatus('submitted')
        setIsProcessing(true)
        // Note: Link URL is kept so user can see what was submitted
      } else {
        // Unexpected response format
        setError('An unexpected error occurred. Please try again.')
        setStatus('idle')
        setIsProcessing(false)
      }
    } catch (err) {
      // Network or unexpected error
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      )
      setStatus('idle')
      setIsProcessing(false)
    }
  }

  /**
   * Handle submitting another video
   * Resets component state for new submission
   */
  function handleSubmitAnother() {
    setLinkUrl('')
    setJobId(null)
    setStatus('idle')
    setError(null)
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold">AI-Powered Sermon Generator (Queue)</h3>
        <p className="text-xs text-muted-foreground">
          Submit a video link for background processing. You can navigate away and check status later.
        </p>
      </div>

      {/* Link Input */}
      <div className="space-y-1.5">
        <Label htmlFor="ai-link-queue-input">Video URL</Label>
        <Input
          id="ai-link-queue-input"
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={isProcessing || status === 'submitted' || status === 'processing'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isLinkValid && !isProcessing && status === 'idle') {
              e.preventDefault()
              handleProcessVideo()
            }
          }}
        />
      </div>

      {/* Success Message with Job ID */}
      {status === 'submitted' && jobId && !progress && (
        <div 
          className="flex items-start gap-2 rounded-md border border-green-500/50 bg-green-500/10 p-3"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-green-600">
              Processing started. Job ID: {jobId}
            </p>
            <p className="text-xs text-green-600/80">
              Your video is being processed in the background. You can navigate away and check the status later in the Job Status Dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar with Percentage and Current Step */}
      {isProcessing && progress && (
        <div 
          className="space-y-3 rounded-md border border-blue-500/50 bg-blue-500/10 p-4"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Current Step and Percentage */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {progress.currentStep}
            </span>
            <span className="text-sm font-semibold text-blue-700">
              {progress.percentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progress.percentage}%` }}
              role="progressbar"
              aria-valuenow={progress.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Processing progress: ${progress.percentage}%`}
            />
          </div>

          {/* Estimated Time Remaining */}
          {progress.estimatedTimeRemaining !== undefined && progress.estimatedTimeRemaining > 0 && (
            <p className="text-xs text-blue-700">
              Estimated time remaining: {Math.ceil(progress.estimatedTimeRemaining / 60)} {Math.ceil(progress.estimatedTimeRemaining / 60) === 1 ? 'minute' : 'minutes'}
            </p>
          )}

          {/* Job ID and Navigation Hint */}
          <p className="text-xs text-blue-600/70">
            Job ID: {jobId} • You can navigate away and check back later
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div 
          className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-sm text-destructive">
            {error}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {status === 'idle' || status === 'submitting' ? (
          <Button
            type="button"
            size="sm"
            onClick={handleProcessVideo}
            disabled={isButtonDisabled}
            title={!isLinkValid ? 'Please enter a valid video URL' : undefined}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Process Video'
            )}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSubmitAnother}
            disabled={isProcessing}
          >
            Submit Another Video
          </Button>
        )}
      </div>
    </div>
  )
}
