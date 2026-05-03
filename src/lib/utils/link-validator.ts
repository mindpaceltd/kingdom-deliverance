/**
 * Link Validation Utility for Sermon AI Link Processor
 * 
 * Validates media links (YouTube, Vimeo, direct video files) and returns
 * appropriate validation results with error messages for unsupported platforms.
 */

import type { LinkValidation } from '../types'

/**
 * Validates a media link URL and determines if it's supported for processing.
 * 
 * Supported formats:
 * - YouTube: youtube.com/watch?v=*, youtu.be/*, youtube.com/embed/*
 * 
 * Unsupported formats (return error):
 * - Vimeo: vimeo.com/*
 * - Direct video files: *.mp4, *.webm, *.ogg, *.mov
 * 
 * @param url - The URL string to validate
 * @returns LinkValidation object with valid status, type, and error message
 */
export function validateMediaLink(url: string): LinkValidation {
  // Check if URL is well-formed and has a valid protocol
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    // Ensure the URL has http or https protocol
    if (!parsedUrl.protocol.startsWith('http')) {
      return { valid: false, error: 'Invalid URL format' }
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  // YouTube patterns - SUPPORTED
  // Matches: youtube.com/watch?v=VIDEO_ID (exactly 11 chars), youtu.be/VIDEO_ID, youtube.com/embed/VIDEO_ID
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:[&?#]|$)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?#]|$)/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[?#]|$)/,
  ]

  for (const pattern of youtubePatterns) {
    if (pattern.test(url)) {
      return { valid: true, type: 'youtube' }
    }
  }

  // Vimeo patterns - UNSUPPORTED
  if (/vimeo\.com\/\d+/.test(url)) {
    return {
      valid: false,
      type: 'vimeo',
      error: 'Vimeo videos are not yet supported. Please use YouTube links or enter content manually.',
    }
  }

  // Direct video file patterns - UNSUPPORTED
  // Check both the pathname and the full URL to handle query parameters
  const pathname = parsedUrl.pathname
  if (/\.(mp4|webm|ogg|mov)$/i.test(pathname)) {
    return {
      valid: false,
      type: 'direct',
      error: 'Direct video files are not yet supported. Please use YouTube links or enter content manually.',
    }
  }

  // No pattern matched
  return {
    valid: false,
    error: 'Unsupported link format. Please paste a YouTube video URL.',
  }
}
