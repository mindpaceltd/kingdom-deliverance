'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, X, AlertCircle } from 'lucide-react'
import { processSermonLink } from '@/lib/actions/sermon-ai-processor'
import type { SermonDraft, ProcessingStep } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AILinkProcessorProps {
  /** Callback invoked when draft is successfully generated */
  onDraftGenerated: (draft: SermonDraft) => void
}

// ---------------------------------------------------------------------------
// AILinkProcessor
// ---------------------------------------------------------------------------

export function AILinkProcessor({ onDraftGenerated }: AILinkProcessorProps) {
  const [linkUrl, setLinkUrl] = React.useState('')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [processingStep, setProcessingStep] = React.useState<ProcessingStep | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  // Client-side URL validation: disable button if empty or whitespace
  const isLinkValid = linkUrl.trim().length > 0
  const isButtonDisabled = !isLinkValid || isProcessing

  /**
   * Handle Process button click
   * Calls processSermonLink server action and manages UI state
   */
  async function handleProcess() {
    if (!isLinkValid) return

    // Clear previous error
    setError(null)
    setIsProcessing(true)

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      // Step 1: Validating
      setProcessingStep({ step: 1, label: 'Validating link...' })

      // Call server action
      const result = await processSermonLink(linkUrl.trim())

      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      // Step 2: Extracting transcript (simulated for UI feedback)
      setProcessingStep({ step: 2, label: 'Extracting transcript...' })

      // Step 3: Generating summary (simulated for UI feedback)
      setProcessingStep({ step: 3, label: 'Generating summary...' })

      // Step 4: Optimizing for SEO (simulated for UI feedback)
      setProcessingStep({ step: 4, label: 'Optimizing for SEO...' })

      // Handle result
      if ('error' in result && result.error) {
        setError(result.error)
        setIsProcessing(false)
        setProcessingStep(null)
        return
      }

      if (result.success && result.draft) {
        // Success: call callback with draft data
        onDraftGenerated(result.draft)

        // Clear link input after successful processing
        setLinkUrl('')
        setIsProcessing(false)
        setProcessingStep(null)
      } else {
        // Unexpected response format
        setError('An unexpected error occurred. Please try again or enter content manually.')
        setIsProcessing(false)
        setProcessingStep(null)
      }
    } catch (err) {
      // Network or unexpected error
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again or enter content manually.'
      )
      setIsProcessing(false)
      setProcessingStep(null)
    }
  }

  /**
   * Handle Cancel button click
   * Aborts processing and resets UI state
   */
  function handleCancel() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsProcessing(false)
    setProcessingStep(null)
    setError(null)
  }

  /**
   * Handle error dismissal
   */
  function handleDismissError() {
    setError(null)
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold">AI-Powered Sermon Generator</h3>
        <p className="text-xs text-muted-foreground">
          Paste a YouTube link to automatically generate sermon content using AI
        </p>
      </div>

      {/* Link Input */}
      <div className="space-y-1.5">
        <Label htmlFor="ai-link-input">Paste Media Link</Label>
        <Input
          id="ai-link-input"
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={isProcessing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isLinkValid && !isProcessing) {
              e.preventDefault()
              handleProcess()
            }
          }}
        />
      </div>

      {/* Processing Status Indicator */}
      {isProcessing && processingStep && (
        <div 
          className="flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          <span className="text-primary">
            Step {processingStep.step}/4: {processingStep.label}
          </span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div 
          className="relative rounded-md border border-destructive/50 bg-destructive/10 p-3"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="flex items-start gap-2 pr-8">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-sm text-destructive">
              {error}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-destructive/20"
            onClick={handleDismissError}
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleProcess}
          disabled={isButtonDisabled}
          title={!isLinkValid ? 'Please enter a valid link' : undefined}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Process Link'
          )}
        </Button>

        {isProcessing && (
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
