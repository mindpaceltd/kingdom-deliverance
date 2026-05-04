/**
 * Sermon Processor Worker
 *
 * Separate Node.js process that consumes jobs from the BullMQ queue and executes
 * the sermon processing pipeline: audio extraction → transcription → AI processing.
 *
 * Features:
 * - Consumes jobs from Redis-backed BullMQ queue
 * - Updates job progress in real-time
 * - Handles graceful shutdown (SIGTERM/SIGINT)
 * - Configurable concurrency and timeout settings
 * - Comprehensive error handling, classification, and logging
 * - Audio file cleanup in both success and failure paths (try/finally)
 * - Retryable vs non-retryable error classification
 *
 * Requirements: 2.1, 2.2, 2.7, 7.2, 7.6, 8.1, 8.5, 13.1, 13.5, 15.4
 */

import { Worker, Job } from 'bullmq'
import { createRedisConnection } from '../lib/config/redis'
import { SERMON_QUEUE_NAME } from '../lib/config/queue'
import { AudioExtractor } from '../lib/services/audio-extractor'
import { TranscriptionService } from '../lib/services/transcription-service'
import { OllamaAIService } from '../lib/services/ollama-ai-service'
import {
  createProcessingLog,
  updateProcessingLog,
} from '../lib/services/processing-log'
import { classifyError, NonRetryableError } from '../lib/errors/processing-errors'
import type {
  SermonJobData,
  SermonJobResult,
  SermonDraft,
} from '../lib/types/queue-processor'

// Initialize Redis connection
const redis = createRedisConnection()

/**
 * Worker configuration from environment variables
 */
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '1')
const LOCK_DURATION = 60 * 60 * 1000 // 60 minutes
const STALLED_INTERVAL = 60 * 1000 // Check for stalled jobs every 1 minute

/**
 * Main job processor function
 * Executes the complete sermon processing pipeline.
 *
 * Audio cleanup is guaranteed via a try/finally block so the temporary
 * file is removed whether the job succeeds or fails.
 *
 * Non-retryable errors (video deleted, transcript too short, etc.) are
 * wrapped in NonRetryableError and the job is discarded before re-throwing
 * so BullMQ does not consume any remaining retry attempts.
 *
 * @param job - BullMQ job containing sermon processing data
 * @returns Processing result with draft and duration
 */
async function processSermonJob(
  job: Job<SermonJobData, SermonJobResult>
): Promise<SermonJobResult> {
  const startTime = Date.now()
  const retryCount = job.attemptsMade
  let logId: string | null = null
  // Track audioPath outside the inner try so the finally block can clean it up
  let audioPath: string | null = null

  // Create processing log entry with job_id and current retry count
  try {
    logId = await createProcessingLog(
      job.data.userId,
      job.data.videoUrl,
      'processing',
      job.id!,
      retryCount
    )
  } catch (logError) {
    // Log creation failure is non-fatal — continue processing
    console.error(
      `[Worker] Failed to create processing log for job ${job.id}:`,
      logError
    )
  }

  try {
    // ----------------------------------------------------------------
    // Step 1: Extract audio (10%)
    // ----------------------------------------------------------------
    await job.updateProgress({
      status: 'extracting_audio',
      percentage: 10,
      currentStep: 'Extracting audio from video...',
    })

    audioPath = await AudioExtractor.extractAudio(
      job.data.videoUrl,
      job.id!
    )

    // ----------------------------------------------------------------
    // Step 2: Transcribe audio (30% → 70%)
    // ----------------------------------------------------------------
    await job.updateProgress({
      status: 'transcribing',
      percentage: 30,
      currentStep: 'Transcribing audio to text...',
    })

    const transcript = await TranscriptionService.transcribe(
      audioPath,
      (progress) => {
        job.updateProgress({
          status: 'transcribing',
          percentage: 30 + progress * 0.4, // 30% to 70%
          currentStep: `Transcribing audio... ${Math.round(progress * 100)}%`,
        })
      }
    )

    // ----------------------------------------------------------------
    // Step 3: Generate summary (70%)
    // ----------------------------------------------------------------
    await job.updateProgress({
      status: 'summarizing',
      percentage: 70,
      currentStep: 'Generating sermon summary...',
    })

    const summary = await OllamaAIService.generateSummary(transcript)

    // ----------------------------------------------------------------
    // Step 4: Generate SEO (90%)
    // ----------------------------------------------------------------
    await job.updateProgress({
      status: 'generating_seo',
      percentage: 90,
      currentStep: 'Optimizing for SEO...',
    })

    const seo = await OllamaAIService.generateSEO(transcript, summary)

    // ----------------------------------------------------------------
    // Step 5: Store draft in Redis with 24-hour TTL
    // ----------------------------------------------------------------
    const draft: SermonDraft = {
      title: seo.title,
      description: seo.description,
      content: summary,
      keywords: seo.keywords,
      video_url: job.data.videoUrl,
      transcript,
    }

    await redis.setex(`draft:${job.id}`, 24 * 60 * 60, JSON.stringify(draft))

    // ----------------------------------------------------------------
    // Step 6: Mark complete (100%)
    // ----------------------------------------------------------------
    await job.updateProgress({
      status: 'completed',
      percentage: 100,
      currentStep: 'Processing complete!',
    })

    const duration = Date.now() - startTime

    // Log success with full context (req 13.1, 13.5)
    if (logId) {
      try {
        await updateProcessingLog(
          logId,
          'completed',
          undefined,
          duration,
          retryCount,
          'completed'
        )
      } catch (logError) {
        console.error(
          `[Worker] Failed to update processing log for job ${job.id}:`,
          logError
        )
      }
    }

    console.log(
      `[Worker] Job ${job.id} completed in ${duration}ms (attempt ${retryCount + 1})`
    )

    return { draft, processingDuration: duration }
  } catch (error) {
    const duration = Date.now() - startTime

    // Classify the error: wrap non-retryable errors so we can handle them
    const classified = classifyError(error)
    const isNonRetryable = classified instanceof NonRetryableError
    const errorMessage =
      classified instanceof Error ? classified.message : String(classified)

    // Log failure with full context (req 7.6, 13.1, 13.5)
    if (logId) {
      try {
        await updateProcessingLog(
          logId,
          'failed',
          errorMessage,
          duration,
          retryCount,
          'failed'
        )
      } catch (logError) {
        console.error(
          `[Worker] Failed to update processing log for job ${job.id}:`,
          logError
        )
      }
    }

    if (isNonRetryable) {
      // Discard the job so BullMQ skips remaining retry attempts (req 7.4)
      console.error(
        `[Worker] Job ${job.id} failed with non-retryable error (no retry): ${errorMessage}`
      )
      await job.discard()
      throw classified
    }

    // Retryable error — throw to let BullMQ handle retry with backoff (req 7.1, 7.3)
    console.error(
      `[Worker] Job ${job.id} failed with retryable error ` +
        `(attempt ${retryCount + 1}, will retry): ${errorMessage}`
    )
    throw classified
  } finally {
    // Always clean up the temporary audio file (req 3.7, 15.4)
    if (audioPath) {
      await AudioExtractor.deleteAudioFile(audioPath)
    }
  }
}

/**
 * Create and configure the BullMQ worker
 */
const worker = new Worker<SermonJobData, SermonJobResult>(
  SERMON_QUEUE_NAME,
  processSermonJob,
  {
    connection: redis,
    concurrency: WORKER_CONCURRENCY,
    lockDuration: LOCK_DURATION,
    stalledInterval: STALLED_INTERVAL,
  }
)

/**
 * Worker event handlers
 */
worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`)
})

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message)
})

worker.on('stalled', (jobId) => {
  console.warn(`[Worker] Job ${jobId} stalled. Will retry...`)
})

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err)
})

/**
 * Graceful shutdown handlers
 * Ensures current job completes before exiting
 */
process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received. Gracefully shutting down...')
  await worker.close()
  await redis.quit()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[Worker] SIGINT received. Gracefully shutting down...')
  await worker.close()
  await redis.quit()
  process.exit(0)
})

/**
 * Startup message
 */
console.log('[Worker] Sermon processor worker started')
console.log(`[Worker] Concurrency: ${WORKER_CONCURRENCY}`)
console.log(`[Worker] Lock duration: ${LOCK_DURATION}ms`)
console.log(`[Worker] Stalled interval: ${STALLED_INTERVAL}ms`)
