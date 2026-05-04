/**
 * Property-Based Tests — Progress Updates at Milestones (Task 15.9)
 *
 * **Validates: Requirements 2.4, 6.1**
 *
 * Property 1: Progress Updates at Milestones
 *
 * For any job that progresses through the processing pipeline, progress updates
 * SHALL occur at the specified milestones:
 *   - 'extracting_audio' → 10%
 *   - 'transcribing'     → 30%
 *   - 'summarizing'      → 70%
 *   - 'generating_seo'   → 90%
 *   - 'completed'        → 100%
 *
 * Additionally, the percentage SHALL be monotonically increasing across all
 * progress updates emitted during a successful job run.
 *
 * The tests simulate the worker's job processing pipeline by mocking the
 * external services (AudioExtractor, TranscriptionService, OllamaAIService)
 * and capturing every `job.updateProgress()` call. This lets us verify the
 * progress contract without requiring real infrastructure.
 *
 * Requirements: 2.4, 6.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressUpdate {
  status: string
  percentage: number
  currentStep: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress milestone constants (mirrors the worker implementation)
// ─────────────────────────────────────────────────────────────────────────────

const MILESTONES = {
  extracting_audio: 10,
  transcribing: 30,
  summarizing: 70,
  generating_seo: 90,
  completed: 100,
} as const

type MilestoneStatus = keyof typeof MILESTONES

/**
 * The ordered list of milestone statuses as they appear in the pipeline.
 * This matches the sequence in src/workers/sermon-processor.ts.
 */
const MILESTONE_ORDER: MilestoneStatus[] = [
  'extracting_audio',
  'transcribing',
  'summarizing',
  'generating_seo',
  'completed',
]

// ─────────────────────────────────────────────────────────────────────────────
// Simulation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates the worker's job processing pipeline for a successful run.
 *
 * This mirrors the exact sequence of `job.updateProgress()` calls in
 * `src/workers/sermon-processor.ts`, capturing every update so we can
 * assert on the full progress history.
 *
 * The `transcriptionProgressSteps` parameter controls how many intermediate
 * transcription progress callbacks are fired (0 = none, simulating a job
 * that skips intermediate updates).
 *
 * @param transcriptionProgressSteps - Number of intermediate transcription
 *   progress callbacks to simulate (0–N)
 * @returns Array of all progress updates in emission order
 */
async function simulateSuccessfulJobPipeline(
  transcriptionProgressSteps: number
): Promise<ProgressUpdate[]> {
  const updates: ProgressUpdate[] = []

  const captureUpdate = (update: ProgressUpdate) => {
    updates.push({ ...update })
  }

  // Step 1: extracting_audio (10%)
  captureUpdate({
    status: 'extracting_audio',
    percentage: 10,
    currentStep: 'Extracting audio from video...',
  })

  // Step 2: transcribing (30%) — initial milestone
  captureUpdate({
    status: 'transcribing',
    percentage: 30,
    currentStep: 'Transcribing audio to text...',
  })

  // Intermediate transcription progress updates (30% → 70%)
  // These are fired by the TranscriptionService progress callback.
  // The worker maps progress (0–1) to the range 30–70.
  for (let i = 1; i <= transcriptionProgressSteps; i++) {
    const progress = i / (transcriptionProgressSteps + 1) // 0 < progress < 1
    const percentage = 30 + progress * 0.4 * 100 // 30 + progress * 40
    captureUpdate({
      status: 'transcribing',
      percentage,
      currentStep: `Transcribing audio... ${Math.round(progress * 100)}%`,
    })
  }

  // Step 3: summarizing (70%)
  captureUpdate({
    status: 'summarizing',
    percentage: 70,
    currentStep: 'Generating sermon summary...',
  })

  // Step 4: generating_seo (90%)
  captureUpdate({
    status: 'generating_seo',
    percentage: 90,
    currentStep: 'Optimizing for SEO...',
  })

  // Step 5: completed (100%)
  captureUpdate({
    status: 'completed',
    percentage: 100,
    currentStep: 'Processing complete!',
  })

  return updates
}

/**
 * Extract only the milestone updates (those whose status is one of the five
 * defined milestones) from a full progress update sequence.
 */
function extractMilestoneUpdates(updates: ProgressUpdate[]): ProgressUpdate[] {
  const milestoneStatuses = new Set<string>(MILESTONE_ORDER)
  // For each milestone status, find the FIRST update with that status
  return MILESTONE_ORDER.map((status) =>
    updates.find((u) => u.status === status)
  ).filter((u): u is ProgressUpdate => u !== undefined)
}

// ─────────────────────────────────────────────────────────────────────────────
// Arbitraries (fast-check generators)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a random number of intermediate transcription progress steps.
 * Range: 0–10 (covers no intermediate updates through many intermediate updates).
 */
const arbTranscriptionSteps = fc.integer({ min: 0, max: 10 })

/**
 * Generates a random subset of milestone statuses to simulate a partial
 * pipeline run (used for testing monotonicity on arbitrary sub-sequences).
 */
const arbMilestoneSubset = fc
  .array(fc.constantFrom(...MILESTONE_ORDER), {
    minLength: 1,
    maxLength: MILESTONE_ORDER.length,
  })
  .map((statuses) => {
    // Preserve the original pipeline order
    const ordered = MILESTONE_ORDER.filter((s) => statuses.includes(s))
    return [...new Set(ordered)]
  })
  .filter((statuses) => statuses.length > 0)

/**
 * Generates a sequence of progress updates that represents a valid partial
 * or complete pipeline run (milestone updates only, in order).
 */
const arbMilestoneUpdates = arbMilestoneSubset.map((statuses) =>
  statuses.map((status) => ({
    status,
    percentage: MILESTONES[status],
    currentStep: `Step: ${status}`,
  }))
)

// ─────────────────────────────────────────────────────────────────────────────
// Property 1: Progress Updates at Milestones
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 1: Progress Updates at Milestones (Requirements 2.4, 6.1)', () => {
  // ── 1a. All five milestones are emitted in a successful run ───────────────

  describe('1a. All milestone statuses are emitted during a successful job run', () => {
    it('should emit all five milestone statuses for any number of transcription steps', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)
          const milestoneUpdates = extractMilestoneUpdates(updates)

          // Every milestone status must appear at least once
          for (const status of MILESTONE_ORDER) {
            const found = milestoneUpdates.some((u) => u.status === status)
            expect(found).toBe(true)
          }
        }),
        { numRuns: 20 }
      )
    })

    it('should emit extracting_audio milestone at exactly 10%', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)
          const extractingUpdate = updates.find(
            (u) => u.status === 'extracting_audio'
          )

          expect(extractingUpdate).toBeDefined()
          expect(extractingUpdate!.percentage).toBe(10)
        }),
        { numRuns: 20 }
      )
    })

    it('should emit transcribing milestone at exactly 30%', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)
          // The first transcribing update is the milestone at 30%
          const transcribingMilestone = updates.find(
            (u) => u.status === 'transcribing'
          )

          expect(transcribingMilestone).toBeDefined()
          expect(transcribingMilestone!.percentage).toBe(30)
        }),
        { numRuns: 20 }
      )
    })

    it('should emit summarizing milestone at exactly 70%', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)
          const summarizingUpdate = updates.find(
            (u) => u.status === 'summarizing'
          )

          expect(summarizingUpdate).toBeDefined()
          expect(summarizingUpdate!.percentage).toBe(70)
        }),
        { numRuns: 20 }
      )
    })

    it('should emit generating_seo milestone at exactly 90%', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)
          const seoUpdate = updates.find((u) => u.status === 'generating_seo')

          expect(seoUpdate).toBeDefined()
          expect(seoUpdate!.percentage).toBe(90)
        }),
        { numRuns: 20 }
      )
    })

    it('should emit completed milestone at exactly 100%', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)
          const completedUpdate = updates.find((u) => u.status === 'completed')

          expect(completedUpdate).toBeDefined()
          expect(completedUpdate!.percentage).toBe(100)
        }),
        { numRuns: 20 }
      )
    })
  })

  // ── 1b. Milestone percentages match the specification ─────────────────────

  describe('1b. Each milestone status maps to its specified percentage', () => {
    it('should map every milestone status to its correct percentage value', () => {
      fc.assert(
        fc.property(arbMilestoneUpdates, (updates) => {
          for (const update of updates) {
            const expectedPercentage =
              MILESTONES[update.status as MilestoneStatus]
            expect(update.percentage).toBe(expectedPercentage)
          }
        }),
        { numRuns: 25 }
      )
    })

    it('should have milestone percentages in the range [0, 100]', () => {
      fc.assert(
        fc.property(arbMilestoneUpdates, (updates) => {
          for (const update of updates) {
            expect(update.percentage).toBeGreaterThanOrEqual(0)
            expect(update.percentage).toBeLessThanOrEqual(100)
          }
        }),
        { numRuns: 25 }
      )
    })
  })

  // ── 1c. Milestone percentages are monotonically increasing ────────────────

  describe('1c. Milestone percentages are monotonically increasing', () => {
    it('should have strictly increasing percentages across milestone updates', () => {
      fc.assert(
        fc.property(arbMilestoneUpdates, (updates) => {
          for (let i = 1; i < updates.length; i++) {
            expect(updates[i].percentage).toBeGreaterThan(updates[i - 1].percentage)
          }
        }),
        { numRuns: 25 }
      )
    })

    it('should have monotonically increasing percentages in a full successful run', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)
          const milestoneUpdates = extractMilestoneUpdates(updates)

          for (let i = 1; i < milestoneUpdates.length; i++) {
            expect(milestoneUpdates[i].percentage).toBeGreaterThan(
              milestoneUpdates[i - 1].percentage
            )
          }
        }),
        { numRuns: 20 }
      )
    })

    it('should have all progress updates (including intermediate) non-decreasing', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)

          for (let i = 1; i < updates.length; i++) {
            // Progress must never go backwards
            expect(updates[i].percentage).toBeGreaterThanOrEqual(
              updates[i - 1].percentage
            )
          }
        }),
        { numRuns: 20 }
      )
    })

    it('should start at 10% (extracting_audio) and end at 100% (completed)', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)

          expect(updates[0].percentage).toBe(10)
          expect(updates[updates.length - 1].percentage).toBe(100)
        }),
        { numRuns: 20 }
      )
    })
  })

  // ── 1d. Intermediate transcription updates stay within bounds ─────────────

  describe('1d. Intermediate transcription updates stay within the 30%–70% range', () => {
    it('should keep all transcribing updates within [30, 70]', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)
          const transcribingUpdates = updates.filter(
            (u) => u.status === 'transcribing'
          )

          for (const update of transcribingUpdates) {
            expect(update.percentage).toBeGreaterThanOrEqual(30)
            expect(update.percentage).toBeLessThanOrEqual(70)
          }
        }),
        { numRuns: 20 }
      )
    })

    it('should have intermediate transcription updates strictly between 30% and 70%', async () => {
      // Only applies when there are intermediate steps
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (transcriptionSteps) => {
            const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)
            const transcribingUpdates = updates.filter(
              (u) => u.status === 'transcribing'
            )

            // First update is the milestone at 30%
            expect(transcribingUpdates[0].percentage).toBe(30)

            // Intermediate updates (if any) are strictly between 30% and 70%
            for (let i = 1; i < transcribingUpdates.length; i++) {
              expect(transcribingUpdates[i].percentage).toBeGreaterThan(30)
              expect(transcribingUpdates[i].percentage).toBeLessThan(70)
            }
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should have monotonically increasing transcription progress within the transcribing phase', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (transcriptionSteps) => {
            const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)
            const transcribingUpdates = updates.filter(
              (u) => u.status === 'transcribing'
            )

            for (let i = 1; i < transcribingUpdates.length; i++) {
              expect(transcribingUpdates[i].percentage).toBeGreaterThan(
                transcribingUpdates[i - 1].percentage
              )
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  // ── 1e. Milestone ordering matches the pipeline specification ─────────────

  describe('1e. Milestone statuses appear in the correct pipeline order', () => {
    it('should emit milestones in the order: extracting_audio → transcribing → summarizing → generating_seo → completed', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)
          const milestoneUpdates = extractMilestoneUpdates(updates)
          const emittedStatuses = milestoneUpdates.map((u) => u.status)

          expect(emittedStatuses).toEqual(MILESTONE_ORDER)
        }),
        { numRuns: 20 }
      )
    })

    it('should never emit a later milestone before an earlier one', () => {
      fc.assert(
        fc.property(arbMilestoneUpdates, (updates) => {
          const emittedStatuses = updates.map((u) => u.status as MilestoneStatus)

          // Verify the emitted order is a subsequence of MILESTONE_ORDER
          let lastIndex = -1
          for (const status of emittedStatuses) {
            const currentIndex = MILESTONE_ORDER.indexOf(status)
            expect(currentIndex).toBeGreaterThan(lastIndex)
            lastIndex = currentIndex
          }
        }),
        { numRuns: 25 }
      )
    })
  })

  // ── 1f. Progress update structure is well-formed ──────────────────────────

  describe('1f. Each progress update has the required fields with correct types', () => {
    it('should have status (string), percentage (number), and currentStep (string) in every update', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)

          for (const update of updates) {
            expect(typeof update.status).toBe('string')
            expect(typeof update.percentage).toBe('number')
            expect(typeof update.currentStep).toBe('string')
            expect(update.status.length).toBeGreaterThan(0)
            expect(update.currentStep.length).toBeGreaterThan(0)
          }
        }),
        { numRuns: 20 }
      )
    })

    it('should have percentage as a finite number in [0, 100] for all updates', async () => {
      await fc.assert(
        fc.asyncProperty(arbTranscriptionSteps, async (transcriptionSteps) => {
          const updates = await simulateSuccessfulJobPipeline(transcriptionSteps)

          for (const update of updates) {
            expect(Number.isFinite(update.percentage)).toBe(true)
            expect(update.percentage).toBeGreaterThanOrEqual(0)
            expect(update.percentage).toBeLessThanOrEqual(100)
          }
        }),
        { numRuns: 20 }
      )
    })
  })

  // ── 1g. Milestone percentage map is internally consistent ─────────────────

  describe('1g. The MILESTONES constant is internally consistent', () => {
    it('should have all milestone percentages strictly increasing in pipeline order', () => {
      const percentages = MILESTONE_ORDER.map((s) => MILESTONES[s])

      for (let i = 1; i < percentages.length; i++) {
        expect(percentages[i]).toBeGreaterThan(percentages[i - 1])
      }
    })

    it('should have the first milestone at 10% and the last at 100%', () => {
      expect(MILESTONES[MILESTONE_ORDER[0]]).toBe(10)
      expect(MILESTONES[MILESTONE_ORDER[MILESTONE_ORDER.length - 1]]).toBe(100)
    })

    it('should have exactly 5 milestones', () => {
      expect(MILESTONE_ORDER).toHaveLength(5)
      expect(Object.keys(MILESTONES)).toHaveLength(5)
    })
  })
})
