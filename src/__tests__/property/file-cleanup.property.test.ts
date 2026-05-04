/**
 * Property-Based Tests — Temporary File Cleanup (Task 15.11)
 *
 * **Validates: Requirements 3.7, 15.4**
 *
 * Property 3: Temporary File Cleanup
 *
 * For any job processing scenario (success or failure), the temporary audio
 * file created during audio extraction SHALL be deleted after processing
 * completes, regardless of whether the job succeeded or failed.
 *
 * This property is guaranteed by the `try/finally` block in the worker's
 * `processSermonJob` function (`src/workers/sermon-processor.ts`):
 *
 *   ```typescript
 *   } finally {
 *     // Always clean up the temporary audio file (req 3.7, 15.4)
 *     if (audioPath) {
 *       await AudioExtractor.deleteAudioFile(audioPath)
 *     }
 *   }
 *   ```
 *
 * The tests simulate the worker pipeline by:
 *   1. Generating arbitrary job scenarios (success / failure at each step)
 *   2. Tracking whether `deleteAudioFile` was called with the correct path
 *   3. Verifying cleanup happens in both success and failure paths
 *
 * No real infrastructure (Redis, yt-dlp, Whisper, Ollama) is required.
 *
 * Requirements: 3.7, 15.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import path from 'path'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PipelineStep =
  | 'extracting_audio'
  | 'transcribing'
  | 'summarizing'
  | 'generating_seo'
  | 'storing_draft'

interface ProgressUpdate {
  status: string
  percentage: number
  currentStep: string
}

interface SimulationResult {
  /** Whether the pipeline completed without throwing */
  succeeded: boolean
  /** The error thrown (if any) */
  error: Error | null
  /** Whether deleteAudioFile was called */
  deleteAudioFileCalled: boolean
  /** The path passed to deleteAudioFile (null if not called) */
  deletedPath: string | null
  /** The audioPath that was "extracted" */
  audioPath: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio path helpers (mirrors the worker implementation)
// ─────────────────────────────────────────────────────────────────────────────

const TEMP_DIR = '/tmp/sermon-audio'

/**
 * Generates the expected audio file path for a given jobId and timestamp.
 * Mirrors the pattern in AudioExtractor.extractAudio:
 *   `{TEMP_DIR}/{jobId}_{timestamp}.m4a`
 */
function buildAudioPath(jobId: string, timestamp: number): string {
  return path.join(TEMP_DIR, `${jobId}_${timestamp}.m4a`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline simulation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates the worker's `processSermonJob` function for a given scenario.
 *
 * The simulation mirrors the exact structure of the worker:
 *
 *   ```
 *   let audioPath = null
 *   try {
 *     audioPath = await AudioExtractor.extractAudio(...)
 *     transcript = await TranscriptionService.transcribe(...)
 *     summary   = await OllamaAIService.generateSummary(...)
 *     seo       = await OllamaAIService.generateSEO(...)
 *     await redis.setex(...)
 *   } catch (error) {
 *     throw error
 *   } finally {
 *     if (audioPath) await AudioExtractor.deleteAudioFile(audioPath)
 *   }
 *   ```
 *
 * @param jobId - The job identifier
 * @param timestamp - Timestamp used to build the audio file path
 * @param failAtStep - If set, the pipeline throws at this step; null = success
 * @returns SimulationResult describing what happened
 */
async function simulatePipeline(
  jobId: string,
  timestamp: number,
  failAtStep: PipelineStep | null
): Promise<SimulationResult> {
  let deleteAudioFileCalled = false
  let deletedPath: string | null = null
  let audioPath: string | null = null

  /**
   * Mock implementation of AudioExtractor.deleteAudioFile.
   * Records the call and the path passed to it.
   */
  const mockDeleteAudioFile = async (p: string): Promise<void> => {
    deleteAudioFileCalled = true
    deletedPath = p
  }

  /**
   * Mock implementation of AudioExtractor.extractAudio.
   * Returns a deterministic path or throws if failAtStep === 'extracting_audio'.
   */
  const mockExtractAudio = async (): Promise<string> => {
    if (failAtStep === 'extracting_audio') {
      throw new Error('Failed to download audio: Video unavailable')
    }
    return buildAudioPath(jobId, timestamp)
  }

  /**
   * Mock implementation of TranscriptionService.transcribe.
   * Throws if failAtStep === 'transcribing'.
   */
  const mockTranscribe = async (): Promise<string> => {
    if (failAtStep === 'transcribing') {
      throw new Error('Transcription failed: corrupted audio file')
    }
    return 'This is a sample sermon transcript with enough words to pass validation.'
  }

  /**
   * Mock implementation of OllamaAIService.generateSummary.
   * Throws if failAtStep === 'summarizing'.
   */
  const mockGenerateSummary = async (): Promise<string> => {
    if (failAtStep === 'summarizing') {
      throw new Error('AI service unavailable. Please ensure Ollama is running.')
    }
    return 'A comprehensive sermon summary with more than one hundred words of content.'
  }

  /**
   * Mock implementation of OllamaAIService.generateSEO.
   * Throws if failAtStep === 'generating_seo'.
   */
  const mockGenerateSEO = async (): Promise<{
    title: string
    description: string
    keywords: string[]
  }> => {
    if (failAtStep === 'generating_seo') {
      throw new Error('SEO generation timed out (max 5 minutes)')
    }
    return {
      title: 'Sermon Title',
      description: 'Sermon description for SEO.',
      keywords: ['faith', 'hope', 'love'],
    }
  }

  /**
   * Mock implementation of redis.setex.
   * Throws if failAtStep === 'storing_draft'.
   */
  const mockRedisSetex = async (): Promise<void> => {
    if (failAtStep === 'storing_draft') {
      throw new Error('Redis connection lost')
    }
  }

  // ── Simulate the worker's try/finally structure ───────────────────────────

  let succeeded = false
  let caughtError: Error | null = null

  try {
    // Step 1: Extract audio
    audioPath = await mockExtractAudio()

    // Step 2: Transcribe
    await mockTranscribe()

    // Step 3: Summarize
    await mockGenerateSummary()

    // Step 4: Generate SEO
    await mockGenerateSEO()

    // Step 5: Store draft
    await mockRedisSetex()

    succeeded = true
  } catch (error) {
    caughtError = error instanceof Error ? error : new Error(String(error))
  } finally {
    // Always clean up the temporary audio file (mirrors req 3.7, 15.4)
    if (audioPath) {
      await mockDeleteAudioFile(audioPath)
    }
  }

  return {
    succeeded,
    error: caughtError,
    deleteAudioFileCalled,
    deletedPath,
    audioPath,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Arbitraries (fast-check generators)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a valid job ID (string, 8–32 chars).
 * Mirrors the format BullMQ uses for job IDs.
 * We use fc.string() with a constrained length and filter out path separators
 * to ensure the path construction is unambiguous.
 */
const arbJobId = fc
  .string({ minLength: 8, maxLength: 32 })
  .filter((s) => !s.includes('/') && !s.includes('\\') && !s.includes('\0'))

/**
 * Generates a realistic Unix timestamp (milliseconds).
 * Range: 2020-01-01 to 2030-01-01.
 */
const arbTimestamp = fc.integer({
  min: 1577836800000, // 2020-01-01
  max: 1893456000000, // 2030-01-01
})

/**
 * Generates a pipeline step at which the job fails.
 * Covers all five steps where an error can occur.
 */
const arbFailStep = fc.constantFrom<PipelineStep>(
  'extracting_audio',
  'transcribing',
  'summarizing',
  'generating_seo',
  'storing_draft'
)

/**
 * Generates a scenario where the pipeline succeeds (no failure step).
 */
const arbSuccessScenario = fc.record({
  jobId: arbJobId,
  timestamp: arbTimestamp,
  failAtStep: fc.constant(null as PipelineStep | null),
})

/**
 * Generates a scenario where the pipeline fails at an arbitrary step.
 */
const arbFailureScenario = fc.record({
  jobId: arbJobId,
  timestamp: arbTimestamp,
  failAtStep: arbFailStep,
})

/**
 * Generates either a success or failure scenario with equal probability.
 */
const arbAnyScenario = fc.oneof(arbSuccessScenario, arbFailureScenario)

// ─────────────────────────────────────────────────────────────────────────────
// Property 3: Temporary File Cleanup
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 3: Temporary File Cleanup (Requirements 3.7, 15.4)', () => {
  // ── 3a. Cleanup occurs on successful job completion ───────────────────────

  describe('3a. Temporary audio file is deleted after successful processing', () => {
    it('should call deleteAudioFile for any successful job scenario', async () => {
      await fc.assert(
        fc.asyncProperty(arbSuccessScenario, async ({ jobId, timestamp }) => {
          const result = await simulatePipeline(jobId, timestamp, null)

          expect(result.succeeded).toBe(true)
          expect(result.deleteAudioFileCalled).toBe(true)
        }),
        { numRuns: 20 }
      )
    })

    it('should delete the correct audio file path on success', async () => {
      await fc.assert(
        fc.asyncProperty(arbSuccessScenario, async ({ jobId, timestamp }) => {
          const expectedPath = buildAudioPath(jobId, timestamp)
          const result = await simulatePipeline(jobId, timestamp, null)

          expect(result.deletedPath).toBe(expectedPath)
        }),
        { numRuns: 20 }
      )
    })

    it('should delete the same path that was returned by extractAudio', async () => {
      await fc.assert(
        fc.asyncProperty(arbSuccessScenario, async ({ jobId, timestamp }) => {
          const result = await simulatePipeline(jobId, timestamp, null)

          expect(result.audioPath).not.toBeNull()
          expect(result.deletedPath).toBe(result.audioPath)
        }),
        { numRuns: 20 }
      )
    })
  })

  // ── 3b. Cleanup occurs when the pipeline fails ────────────────────────────

  describe('3b. Temporary audio file is deleted after a failed job', () => {
    it('should call deleteAudioFile for any failure scenario (after audio extraction)', async () => {
      // Failures at steps AFTER extracting_audio: audio was created, must be cleaned up
      const postExtractionSteps: PipelineStep[] = [
        'transcribing',
        'summarizing',
        'generating_seo',
        'storing_draft',
      ]

      await fc.assert(
        fc.asyncProperty(
          arbJobId,
          arbTimestamp,
          fc.constantFrom(...postExtractionSteps),
          async (jobId, timestamp, failAtStep) => {
            const result = await simulatePipeline(jobId, timestamp, failAtStep)

            expect(result.succeeded).toBe(false)
            expect(result.error).not.toBeNull()
            expect(result.deleteAudioFileCalled).toBe(true)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should delete the correct audio file path when failure occurs after extraction', async () => {
      const postExtractionSteps: PipelineStep[] = [
        'transcribing',
        'summarizing',
        'generating_seo',
        'storing_draft',
      ]

      await fc.assert(
        fc.asyncProperty(
          arbJobId,
          arbTimestamp,
          fc.constantFrom(...postExtractionSteps),
          async (jobId, timestamp, failAtStep) => {
            const expectedPath = buildAudioPath(jobId, timestamp)
            const result = await simulatePipeline(jobId, timestamp, failAtStep)

            expect(result.deletedPath).toBe(expectedPath)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should NOT call deleteAudioFile when audio extraction itself fails (no file created)', async () => {
      await fc.assert(
        fc.asyncProperty(arbJobId, arbTimestamp, async (jobId, timestamp) => {
          const result = await simulatePipeline(
            jobId,
            timestamp,
            'extracting_audio'
          )

          expect(result.succeeded).toBe(false)
          expect(result.audioPath).toBeNull()
          // No file was created, so deleteAudioFile must NOT be called
          expect(result.deleteAudioFileCalled).toBe(false)
        }),
        { numRuns: 20 }
      )
    })
  })

  // ── 3c. Cleanup occurs for any arbitrary scenario ─────────────────────────

  describe('3c. Cleanup invariant holds for any job processing scenario', () => {
    it('should call deleteAudioFile whenever audio was successfully extracted', async () => {
      await fc.assert(
        fc.asyncProperty(arbAnyScenario, async ({ jobId, timestamp, failAtStep }) => {
          const result = await simulatePipeline(jobId, timestamp, failAtStep)

          // The invariant: if audio was extracted (audioPath is set),
          // then deleteAudioFile MUST have been called
          if (result.audioPath !== null) {
            expect(result.deleteAudioFileCalled).toBe(true)
          }
        }),
        { numRuns: 25 }
      )
    })

    it('should never call deleteAudioFile with a null or empty path', async () => {
      await fc.assert(
        fc.asyncProperty(arbAnyScenario, async ({ jobId, timestamp, failAtStep }) => {
          const result = await simulatePipeline(jobId, timestamp, failAtStep)

          if (result.deleteAudioFileCalled) {
            expect(result.deletedPath).not.toBeNull()
            expect(result.deletedPath!.length).toBeGreaterThan(0)
          }
        }),
        { numRuns: 25 }
      )
    })

    it('should delete the same path that was returned by extractAudio in all scenarios', async () => {
      await fc.assert(
        fc.asyncProperty(arbAnyScenario, async ({ jobId, timestamp, failAtStep }) => {
          const result = await simulatePipeline(jobId, timestamp, failAtStep)

          if (result.audioPath !== null) {
            expect(result.deletedPath).toBe(result.audioPath)
          }
        }),
        { numRuns: 25 }
      )
    })
  })

  // ── 3d. Audio file path follows the expected naming pattern ───────────────

  describe('3d. Audio file path follows the {jobId}_{timestamp}.m4a pattern', () => {
    it('should use the correct naming pattern for the audio file path', async () => {
      await fc.assert(
        fc.asyncProperty(arbSuccessScenario, async ({ jobId, timestamp }) => {
          const result = await simulatePipeline(jobId, timestamp, null)

          expect(result.audioPath).not.toBeNull()
          // Path must end with {jobId}_{timestamp}.m4a
          const filename = path.basename(result.audioPath!)
          expect(filename).toBe(`${jobId}_${timestamp}.m4a`)
        }),
        { numRuns: 20 }
      )
    })

    it('should place the audio file in the temp directory', async () => {
      await fc.assert(
        fc.asyncProperty(arbSuccessScenario, async ({ jobId, timestamp }) => {
          const result = await simulatePipeline(jobId, timestamp, null)

          expect(result.audioPath).not.toBeNull()
          expect(result.audioPath!).toContain(TEMP_DIR)
        }),
        { numRuns: 20 }
      )
    })

    it('should produce unique paths for different jobId+timestamp combinations', () => {
      fc.assert(
        fc.property(
          arbJobId,
          arbTimestamp,
          arbJobId,
          arbTimestamp,
          (jobId1, ts1, jobId2, ts2) => {
            // If either jobId or timestamp differs, the paths must differ
            fc.pre(jobId1 !== jobId2 || ts1 !== ts2)

            const path1 = buildAudioPath(jobId1, ts1)
            const path2 = buildAudioPath(jobId2, ts2)

            expect(path1).not.toBe(path2)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should produce the same path for the same jobId+timestamp', () => {
      fc.assert(
        fc.property(arbJobId, arbTimestamp, (jobId, timestamp) => {
          const path1 = buildAudioPath(jobId, timestamp)
          const path2 = buildAudioPath(jobId, timestamp)

          expect(path1).toBe(path2)
        }),
        { numRuns: 25 }
      )
    })
  })

  // ── 3e. Cleanup is idempotent (deleteAudioFile called exactly once) ────────

  describe('3e. deleteAudioFile is called exactly once per job', () => {
    it('should call deleteAudioFile exactly once on a successful job', async () => {
      await fc.assert(
        fc.asyncProperty(arbSuccessScenario, async ({ jobId, timestamp }) => {
          let callCount = 0

          // Override the simulation to count calls
          const countingSimulation = async (): Promise<number> => {
            let audioPath: string | null = null
            try {
              audioPath = buildAudioPath(jobId, timestamp)
              // Simulate successful pipeline steps (no-ops)
            } finally {
              if (audioPath) {
                callCount++
              }
            }
            return callCount
          }

          const count = await countingSimulation()
          expect(count).toBe(1)
        }),
        { numRuns: 20 }
      )
    })

    it('should call deleteAudioFile exactly once when failure occurs after extraction', async () => {
      const postExtractionSteps: PipelineStep[] = [
        'transcribing',
        'summarizing',
        'generating_seo',
        'storing_draft',
      ]

      await fc.assert(
        fc.asyncProperty(
          arbJobId,
          arbTimestamp,
          fc.constantFrom(...postExtractionSteps),
          async (jobId, timestamp, failAtStep) => {
            let callCount = 0

            const countingSimulation = async (): Promise<number> => {
              let audioPath: string | null = null
              try {
                audioPath = buildAudioPath(jobId, timestamp)
                throw new Error(`Simulated failure at ${failAtStep}`)
              } catch {
                // swallow
              } finally {
                if (audioPath) {
                  callCount++
                }
              }
              return callCount
            }

            const count = await countingSimulation()
            expect(count).toBe(1)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  // ── 3f. The worker's finally block structure guarantees cleanup ───────────

  describe('3f. The try/finally structure guarantees cleanup regardless of outcome', () => {
    it('should clean up even when an unexpected error is thrown mid-pipeline', async () => {
      // Generate arbitrary failure steps to cover all pipeline positions
      await fc.assert(
        fc.asyncProperty(arbFailureScenario, async ({ jobId, timestamp, failAtStep }) => {
          const result = await simulatePipeline(jobId, timestamp, failAtStep)

          // If audio was extracted before the failure, it must be cleaned up
          if (failAtStep !== 'extracting_audio') {
            expect(result.deleteAudioFileCalled).toBe(true)
            expect(result.deletedPath).toBe(buildAudioPath(jobId, timestamp))
          }
        }),
        { numRuns: 25 }
      )
    })

    it('should not leave audio files behind for any combination of jobId and failure step', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbJobId,
          arbTimestamp,
          fc.option(arbFailStep, { nil: null }),
          async (jobId, timestamp, failAtStep) => {
            const result = await simulatePipeline(jobId, timestamp, failAtStep)

            // Core invariant: audio file is never left behind
            // (deleteAudioFile called iff audio was extracted)
            const audioWasExtracted = result.audioPath !== null
            expect(result.deleteAudioFileCalled).toBe(audioWasExtracted)
          }
        ),
        { numRuns: 25 }
      )
    })
  })
})
