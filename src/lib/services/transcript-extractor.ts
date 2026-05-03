import { YoutubeTranscript } from 'youtube-transcript'

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * 
 * @param url - YouTube video URL
 * @returns Video ID or null if not found
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

/**
 * Extract transcript from YouTube video URL
 * 
 * @param url - YouTube video URL
 * @returns Full transcript text with normalized whitespace
 * @throws Error if video ID cannot be extracted, transcript is unavailable, or transcript is too short
 */
export async function extractTranscript(url: string): Promise<string> {
  const videoId = extractYouTubeVideoId(url)
  
  if (!videoId) {
    throw new Error('Could not extract video ID from URL')
  }
  
  // Create a timeout promise (5 minutes)
  const timeoutMs = 5 * 60 * 1000
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Transcript extraction timed out after 5 minutes'))
    }, timeoutMs)
  })
  
  try {
    // Race between transcript fetch and timeout
    const transcript = await Promise.race([
      YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en'
      }),
      timeoutPromise
    ])
    
    // Combine transcript segments into full text
    const fullText = transcript
      .map(segment => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    // Validate minimum transcript length
    if (!fullText || fullText.length < 100) {
      throw new Error('Transcript too short or empty')
    }
    
    return fullText
  } catch (error) {
    // Handle specific error cases with descriptive messages
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        throw error
      }
      if (error.message.includes('disabled')) {
        throw new Error('Transcripts are disabled for this video')
      }
      if (error.message.includes('private')) {
        throw new Error('Video is private or unavailable')
      }
      if (error.message.includes('Transcript too short')) {
        throw error
      }
    }
    
    // Generic error for other cases
    throw new Error('Failed to extract transcript. The video may be private or unavailable.')
  }
}
