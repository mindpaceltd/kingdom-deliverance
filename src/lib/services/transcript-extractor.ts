import { YoutubeTranscript } from 'youtube-transcript'

/**
 * Normalize YouTube URL to standard watch format
 * Converts Shorts URLs to regular video URLs for better API compatibility
 * 
 * @param url - YouTube URL in any format
 * @returns Normalized URL in watch?v= format
 */
export function normalizeYouTubeUrl(url: string): string {
  // Extract video ID from Shorts URL
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shortsMatch) {
    const videoId = shortsMatch[1]
    console.log(`[normalizeYouTubeUrl] Converting Shorts URL to standard format: ${videoId}`)
    return `https://www.youtube.com/watch?v=${videoId}`
  }
  
  return url
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * 
 * @param url - YouTube video URL
 * @returns Video ID or null if not found
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
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
 * Production-grade implementation with:
 * - URL normalization (Shorts → watch)
 * - Multiple language fallbacks
 * - Detailed error messages
 * - Comprehensive logging
 * 
 * @param url - YouTube video URL
 * @returns Full transcript text with normalized whitespace
 * @throws Error if video ID cannot be extracted, transcript is unavailable, or transcript is too short
 */
export async function extractTranscript(url: string): Promise<string> {
  // Step 1: Normalize URL (convert Shorts to standard format)
  const normalizedUrl = normalizeYouTubeUrl(url)
  
  // Step 2: Extract video ID
  const videoId = extractYouTubeVideoId(normalizedUrl)
  
  if (!videoId) {
    throw new Error('Could not extract video ID from URL')
  }
  
  console.log(`[extractTranscript] Processing video ID: ${videoId}`)
  console.log(`[extractTranscript] Original URL: ${url}`)
  console.log(`[extractTranscript] Normalized URL: ${normalizedUrl}`)
  
  // Create a timeout promise (5 minutes)
  const timeoutMs = 5 * 60 * 1000
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Transcript extraction timed out after 5 minutes'))
    }, timeoutMs)
  })
  
  try {
    // Step 3: Try fetching transcript with multiple strategies
    
    // Strategy 1: Try multiple language codes
    const languagesToTry = ['en', 'en-US', 'en-GB', 'en-CA']
    let transcript = null
    let lastError = null
    
    for (const lang of languagesToTry) {
      try {
        console.log(`[extractTranscript] Attempting with language: ${lang}`)
        transcript = await Promise.race([
          YoutubeTranscript.fetchTranscript(videoId, { lang }),
          timeoutPromise
        ])
        console.log(`[extractTranscript] ✅ Success with language: ${lang}`)
        break // Success, exit loop
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.log(`[extractTranscript] ❌ Failed with language ${lang}: ${errorMsg}`)
        lastError = err
        // Continue to next language
      }
    }
    
    // Strategy 2: Try without language specification (auto-detect)
    if (!transcript) {
      try {
        console.log(`[extractTranscript] Attempting without language specification (auto-detect)`)
        transcript = await Promise.race([
          YoutubeTranscript.fetchTranscript(videoId),
          timeoutPromise
        ])
        console.log(`[extractTranscript] ✅ Success with auto-detect`)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.log(`[extractTranscript] ❌ Failed with auto-detect: ${errorMsg}`)
        // Use the last error from language attempts
        throw lastError || err
      }
    }
    
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript data returned from YouTube')
    }
    
    // Step 4: Process transcript segments
    const fullText = transcript
      .map(segment => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    console.log(`[extractTranscript] Transcript extracted: ${fullText.length} characters, ${transcript.length} segments`)
    
    // Step 5: Validate minimum transcript length
    if (!fullText || fullText.length < 100) {
      throw new Error(`Transcript too short (${fullText.length} characters). The video may not have sufficient captions.`)
    }
    
    console.log(`[extractTranscript] ✅ Transcript extraction successful`)
    return fullText
    
  } catch (error) {
    console.error(`[extractTranscript] ❌ Final error:`, error)
    
    // Handle specific error cases with descriptive, actionable messages
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      
      // Timeout errors
      if (errorMsg.includes('timed out')) {
        throw error
      }
      
      // Short transcript errors
      if (errorMsg.includes('transcript too short')) {
        throw error
      }
      
      // Disabled captions
      if (errorMsg.includes('disabled') || errorMsg.includes('transcript is disabled')) {
        throw new Error('Captions are disabled for this video. Please enable captions on YouTube and try again.')
      }
      
      // Private/unavailable videos
      if (errorMsg.includes('private') || errorMsg.includes('unavailable')) {
        throw new Error('Video is private or unavailable. Please check the video URL and permissions.')
      }
      
      // No captions found (common with Shorts)
      if (
        errorMsg.includes('could not retrieve') || 
        errorMsg.includes('no transcripts') || 
        errorMsg.includes('not found') ||
        errorMsg.includes('no transcript')
      ) {
        // Check if this was originally a Shorts URL
        const wasShorts = url.includes('/shorts/')
        if (wasShorts) {
          throw new Error(
            'No captions found for this YouTube Short. Shorts often lack accessible captions. ' +
            'Try using a full-length sermon video instead, or manually add captions to the Short on YouTube first.'
          )
        } else {
          throw new Error(
            'No captions found for this video. Please ensure captions are enabled on YouTube. ' +
            'You can add auto-generated or manual captions in YouTube Studio.'
          )
        }
      }
    }
    
    // Generic error with helpful guidance
    const wasShorts = url.includes('/shorts/')
    if (wasShorts) {
      throw new Error(
        'Failed to extract transcript from this YouTube Short. Shorts have limited caption accessibility. ' +
        'Recommendation: Use full-length sermon videos for best results.'
      )
    } else {
      throw new Error(
        'Failed to extract transcript from this video. Please ensure the video has captions enabled and is publicly accessible.'
      )
    }
  }
}
