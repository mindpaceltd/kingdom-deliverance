/**
 * Metrics API Endpoint for Queue Processor
 *
 * GET /api/metrics/queue
 *
 * Returns processing metrics derived from the processing_logs table:
 * - Jobs processed in the last hour and last 24 hours
 * - Average processing time (duration_ms)
 * - Success rate and failure rate
 *
 * This endpoint always returns HTTP 200 — metrics should never fail the caller.
 * If the database query fails, zeroed-out metrics are returned instead.
 *
 * Requirements: 13.4
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Prevent Next.js from statically generating this route at build time.
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PeriodMetrics {
  jobsProcessed: number
  jobsSucceeded: number
  jobsFailed: number
  successRate: number
  failureRate: number
  avgProcessingTimeMs: number
}

interface MetricsResponse {
  timestamp: string
  periods: {
    lastHour: PeriodMetrics
    lastDay: PeriodMetrics
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a zeroed-out PeriodMetrics object used as a safe fallback.
 */
function emptyPeriodMetrics(): PeriodMetrics {
  return {
    jobsProcessed: 0,
    jobsSucceeded: 0,
    jobsFailed: 0,
    successRate: 0,
    failureRate: 0,
    avgProcessingTimeMs: 0,
  }
}

interface LogRow {
  status: string
  duration_ms: number | null
}

/**
 * Compute PeriodMetrics from a set of processing_log rows.
 */
function computeMetrics(rows: LogRow[]): PeriodMetrics {
  const total = rows.length

  if (total === 0) {
    return emptyPeriodMetrics()
  }

  const succeeded = rows.filter((r) => r.status === 'completed').length
  const failed = rows.filter((r) => r.status === 'failed').length

  // Average only over rows that have a recorded duration
  const durationsMs = rows
    .map((r) => r.duration_ms)
    .filter((d): d is number => d !== null && d > 0)

  const avgProcessingTimeMs =
    durationsMs.length > 0
      ? Math.round(durationsMs.reduce((sum, d) => sum + d, 0) / durationsMs.length)
      : 0

  return {
    jobsProcessed: total,
    jobsSucceeded: succeeded,
    jobsFailed: failed,
    successRate: total > 0 ? Math.round((succeeded / total) * 1000) / 1000 : 0,
    failureRate: total > 0 ? Math.round((failed / total) * 1000) / 1000 : 0,
    avgProcessingTimeMs,
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse<MetricsResponse>> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  let lastHourMetrics: PeriodMetrics = emptyPeriodMetrics()
  let lastDayMetrics: PeriodMetrics = emptyPeriodMetrics()

  try {
    const supabase = createAdminClient()

    // Fetch all rows from the last 24 hours in a single query.
    // We can derive the last-hour subset from this result set in memory,
    // avoiding a second round-trip to the database.
    const { data, error } = await supabase
      .from('processing_logs')
      .select('status, duration_ms, created_at')
      .gte('created_at', oneDayAgo)

    if (error) {
      console.error('[metrics/queue] Failed to query processing_logs:', error.message)
      // Fall through — return zeroed metrics rather than an error response
    } else if (data && data.length > 0) {
      // Rows for the last 24 hours
      const dayRows: LogRow[] = data.map((r) => ({
        status: r.status as string,
        duration_ms: r.duration_ms as number | null,
      }))

      // Rows for the last hour (subset of dayRows)
      const hourRows: LogRow[] = data
        .filter((r) => r.created_at >= oneHourAgo)
        .map((r) => ({
          status: r.status as string,
          duration_ms: r.duration_ms as number | null,
        }))

      lastHourMetrics = computeMetrics(hourRows)
      lastDayMetrics = computeMetrics(dayRows)
    }
  } catch (err) {
    // Catch unexpected errors (e.g. missing env vars) so the endpoint never
    // returns a non-200 status.
    console.error('[metrics/queue] Unexpected error:', err)
  }

  const body: MetricsResponse = {
    timestamp: now.toISOString(),
    periods: {
      lastHour: lastHourMetrics,
      lastDay: lastDayMetrics,
    },
  }

  // Always return 200 — metrics endpoints should not fail callers
  return NextResponse.json(body, { status: 200 })
}
