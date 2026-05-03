'use server'

import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'
import { validateMediaLink } from '@/lib/utils/link-validator'
import { extractTranscript, normalizeYouTubeUrl } from '@/lib/services/transcript-extractor'
import { generateSummary, generateSEO } from '@/lib/services/gemini-ai'
import {
  checkRateLimit,
  createProcessingLog,
  updateProcessingLog,
} from '@/lib/services/processing-log'
import { getUserFriendlyError } from '@/lib/utils/error-handler'
import { aiProcessorEnv } from '@/lib/env'
import type { ProcessingResult } from '@/lib/types'

/**
 * Process a sermon link through the AI pipeline
 * 
 * Pipeline steps:
 * 1. Verify user role (admin or editor only)
 * 2. Check rate limit (5 requests per hour)
 * 3. Create processing log entry with status 'pending'
 * 4. Validate link using validateMediaLink()
 * 5. Update log to 'processing', extract transcript using extractTranscript()
 * 6. Generate summary using generateSummary()
 * 7. Generate SEO content using generateSEO()
 * 8. Update log to 'completed' with duration
 * 9. Return ProcessingResult with success=true and draft data
 * 
 * Error handling:
 * - Wrap in try/catch
 * - Update log to 'failed' on error
 * - Return user-friendly error message
 * 
 * Timeout:
 * - Total timeout of 10 minutes (AI_PROCESSING_TIMEOUT_MS)
 * 
 * @param url - The media link URL to process
 * @returns ProcessingResult with success/error and draft data
 */
export async function processSermonLink(url: string): Promise<ProcessingResult> {
  const startTime = Date.now()

  // Step 1: Verify user role (admin or editor only)
  const authResult = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in authResult) {
    return { error: authResult.error === 'Unauthenticated' ? 'Unauthenticated' : 'Forbidden' }
  }

  const profile = authResult
  const userId = profile.id

  // Step 2: Check rate limit
  try {
    const canProcess = await checkRateLimit(userId)
    if (!canProcess) {
      return {
        error: "You've reached the limit of 5 processing requests per hour. Try again later.",
      }
    }
  } catch (error) {
    console.error('[processSermonLink] Rate limit check failed:', error)
    return { error: 'Failed to check rate limit. Please try again.' }
  }

  // Step 3: Create processing log entry with status 'pending'
  let logId: string
  try {
    logId = await createProcessingLog(userId, url, 'pending')
  } catch (error) {
    console.error('[processSermonLink] Failed to create processing log:', error)
    return { error: 'Failed to start processing. Please try again.' }
  }

  // Create a timeout promise (10 minutes)
  const timeoutMs = aiProcessorEnv.processingTimeoutMs
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Processing took too long. Please try again or enter content manually.'))
    }, timeoutMs)
  })

  try {
    // Race the entire processing pipeline against the timeout
    const result = await Promise.race([
      processPipeline(url, logId, startTime),
      timeoutPromise,
    ])

    return result
  } catch (error) {
    // Calculate duration
    const duration = Date.now() - startTime

    // Update log to 'failed'
    try {
      await updateProcessingLog(
        logId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error',
        duration
      )
    } catch (logError) {
      console.error('[processSermonLink] Failed to update processing log:', logError)
    }

    // Return user-friendly error
    const userError = error instanceof Error ? getUserFriendlyError(error) : 'An unexpected error occurred. Please try again or enter content manually.'

    return { error: userError }
  }
}

/**
 * Internal pipeline function that executes the processing steps
 * Separated to allow timeout wrapping
 */
async function processPipeline(
  url: string,
  logId: string,
  startTime: number
): Promise<ProcessingResult> {
  // Step 4: Normalize URL (convert Shorts to standard format)
  const normalizedUrl = normalizeYouTubeUrl(url)
  console.log(`[processPipeline] Original URL: ${url}`)
  console.log(`[processPipeline] Normalized URL: ${normalizedUrl}`)
  
  // Step 5: Validate link
  const validation = validateMediaLink(normalizedUrl)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid link format')
  }

  // Step 6: Update log to 'processing', extract transcript
  await updateProcessingLog(logId, 'processing')
  const transcript = await extractTranscript(normalizedUrl)

  // Step 7: Generate summary
  const summary = await generateSummary(transcript)

  // Step 8: Generate SEO content
  const seo = await generateSEO(transcript, summary)

  // Step 9: Update log to 'completed' with duration
  const duration = Date.now() - startTime
  await updateProcessingLog(logId, 'completed', undefined, duration)

  // Step 10: Return ProcessingResult with success=true and draft data
  // Use the ORIGINAL URL for video_url (preserve Shorts format if that's what user provided)
  return {
    success: true,
    draft: {
      title: seo.title,
      description: seo.description,
      content: summary,
      keywords: seo.keywords,
      video_url: url, // Original URL
      transcript,
    },
  }
}
