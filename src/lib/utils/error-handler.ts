/**
 * Error Handler Utility for Sermon AI Link Processor
 * 
 * Maps technical errors to user-friendly messages with recovery suggestions.
 * Validates Requirements 9.1, 9.2
 */

/**
 * Maps technical errors to user-friendly error messages with recovery suggestions.
 * 
 * @param error - The error object to be mapped
 * @returns A user-friendly error message string
 */
export function getUserFriendlyError(error: Error): string {
  const message = error.message.toLowerCase()

  // Invalid URL format
  if (
    message.includes('invalid url') ||
    message.includes('malformed url') ||
    message.includes('url format')
  ) {
    return 'Invalid URL format. Please paste a valid YouTube link.'
  }

  // Unsupported platform (Vimeo, direct video files)
  if (
    message.includes('vimeo') ||
    message.includes('direct video') ||
    message.includes('not yet supported') ||
    message.includes('unsupported')
  ) {
    return 'Vimeo/direct videos not yet supported. Use YouTube or enter manually.'
  }

  // Video inaccessible (private, deleted, unavailable)
  if (
    message.includes('private') ||
    message.includes('deleted') ||
    message.includes('unavailable') ||
    message.includes('inaccessible') ||
    message.includes('not found') ||
    message.includes('video may be')
  ) {
    return 'Video is private, deleted, or unavailable. Try a different video.'
  }

  // No transcript available
  if (
    message.includes('transcript') &&
    (message.includes('disabled') || message.includes('not available'))
  ) {
    return 'Transcripts are disabled for this video. Please enter content manually.'
  }

  // Transcript too short
  if (
    message.includes('transcript') &&
    (message.includes('too short') || message.includes('empty'))
  ) {
    return 'Transcript is too short to process. Please enter content manually.'
  }

  // AI timeout
  if (
    message.includes('timeout') ||
    message.includes('took too long') ||
    message.includes('timed out')
  ) {
    return 'Processing took too long. Please try again or enter content manually.'
  }

  // AI service error
  if (
    message.includes('ai service') ||
    message.includes('gemini') ||
    message.includes('api error') ||
    message.includes('service error') ||
    message.includes('failed to generate')
  ) {
    return 'AI service temporarily unavailable. Please try again in a few minutes.'
  }

  // Rate limit
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('limit exceeded')
  ) {
    return "You've reached the limit of 5 processing requests per hour. Try again later."
  }

  // Network error
  if (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('fetch failed') ||
    message.includes('econnrefused') ||
    message.includes('enotfound')
  ) {
    return 'Network error. Check your connection and try again.'
  }

  // Generic fallback
  return 'An unexpected error occurred. Please try again or enter content manually.'
}
