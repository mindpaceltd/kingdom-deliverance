import { createAdminClient } from '@/lib/supabase/server'
import { aiProcessorEnv } from '@/lib/env'

/**
 * Create a new processing log entry
 * 
 * @param userId - The ID of the user initiating the processing request
 * @param linkUrl - The URL being processed
 * @param status - Initial status (typically 'pending')
 * @returns The ID of the created log entry
 */
export async function createProcessingLog(
  userId: string,
  linkUrl: string,
  status: string
): Promise<string> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('processing_logs')
    .insert({
      user_id: userId,
      link_url: linkUrl,
      status,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create processing log: ${error.message}`)
  }

  if (!data?.id) {
    throw new Error('Failed to create processing log: No ID returned')
  }

  return data.id
}

/**
 * Update an existing processing log entry
 * 
 * @param logId - The ID of the log entry to update
 * @param status - New status ('processing', 'completed', 'failed')
 * @param errorMessage - Optional error message (for 'failed' status)
 * @param durationMs - Optional processing duration in milliseconds
 */
export async function updateProcessingLog(
  logId: string,
  status: string,
  errorMessage?: string,
  durationMs?: number
): Promise<void> {
  const supabase = createAdminClient()

  const updateData: {
    status: string
    error_message?: string | null
    duration_ms?: number | null
  } = {
    status,
  }

  if (errorMessage !== undefined) {
    updateData.error_message = errorMessage
  }

  if (durationMs !== undefined) {
    updateData.duration_ms = durationMs
  }

  const { error } = await supabase
    .from('processing_logs')
    .update(updateData)
    .eq('id', logId)

  if (error) {
    throw new Error(`Failed to update processing log: ${error.message}`)
  }
}

/**
 * Check if a user has exceeded the rate limit for processing requests
 * 
 * @param userId - The ID of the user to check
 * @returns true if the user can make another request, false if rate limit exceeded
 */
export async function checkRateLimit(userId: string): Promise<boolean> {
  const supabase = createAdminClient()

  // Calculate timestamp for 1 hour ago
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)

  // Query processing_logs for user's requests in past hour
  // Uses idx_processing_logs_user_created index for efficient lookup
  const { count, error } = await supabase
    .from('processing_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo.toISOString())

  if (error) {
    throw new Error(`Failed to check rate limit: ${error.message}`)
  }

  // Return false if count >= rate limit (user has exceeded limit)
  // Return true if count < rate limit (user can make another request)
  return (count ?? 0) < aiProcessorEnv.rateLimitPerHour
}
