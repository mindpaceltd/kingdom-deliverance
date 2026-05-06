'use server'

import { YoutubeTranscript } from 'youtube-transcript'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'
import { createSermon } from './sermons'

export interface AnalyzeSermonRequest {
  videoUrl?: string
  title?: string
}

export interface AnalyzeSermonResult {
  success: boolean
  id?: string
  error?: string
}

// Models tried in order — skips immediately on 503/429/overload/not-found
const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-pro',
]

function isSkippableError(msg: string): boolean {
  return (
    msg.includes('503') ||
    msg.includes('Service Unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('Too Many Requests') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('Not Found')
  )
}

async function runWithFallback(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  let lastError = 'No models available'

  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`[sermon-ai] Trying model: ${modelName}`)
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      if (!text?.trim()) throw new Error('Empty response')
      console.log(`[sermon-ai] ✅ Success with ${modelName}`)
      return text
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      lastError = msg
      console.warn(`[sermon-ai] ❌ ${modelName}: ${msg.slice(0, 120)}`)
      if (isSkippableError(msg)) continue
      break
    }
  }

  const isOverload =
    lastError.includes('503') ||
    lastError.includes('overloaded') ||
    lastError.includes('high demand')
  throw new Error(
    isOverload
      ? 'AI is currently busy. Please try again in a moment.'
      : `AI generation failed: ${lastError.slice(0, 200)}`
  )
}

/**
 * Internal helper to generate sermon draft data using AI
 */
async function generateSermonDraft(
  apiKey: string,
  sourceType: 'video' | 'title',
  contentSource: string
) {
  // 1. Build prompt
  const prompt =
    sourceType === 'video'
      ? `You are an expert sermon editor for Kingdom Deliverance Centre (KDC) Uganda.
Analyze this sermon transcript and generate:
1. A powerful, catchy sermon title.
2. A short, engaging 2-sentence description/excerpt.
3. Well-structured sermon notes in HTML format (Intro, 3 Biblical Points, Closing Prayer). 
   - Use modern, clear Bible translations (like NIV or ESV) for scripture. Do NOT use archaic KJV-style language.
4. A suggested focus keyword (1-2 words).
5. A prompt for an AI image generator that captures the essence of this sermon.

Return ONLY a valid JSON object with keys: title, description, html, focusKeyword, imagePrompt.

Transcript:
${contentSource.slice(0, 30000)}`
      : `You are an expert sermon writer for Kingdom Deliverance Centre (KDC) Uganda.
Create a complete, powerful sermon based on this title: "${contentSource}"

1. Use the provided title as-is.
2. Write a short, engaging 2-sentence description/excerpt.
3. Create well-structured sermon notes in HTML format:
   - Introduction (set context, hook the audience)
   - 3 Main Biblical Points (scripture references, explanations, practical applications)
   - Use modern, clear Bible translations (like NIV or ESV). Avoid archaic KJV-style language.
   - Closing Prayer (powerful, faith-building)
4. Suggest a focus keyword (1-2 words).
5. Create a prompt for an AI image generator.

Make it biblically sound, culturally relevant to Uganda, and spiritually powerful.
Return ONLY a valid JSON object with keys: title, description, html, focusKeyword, imagePrompt.`

  // 2. Run AI with fallback chain
  const responseText = await runWithFallback(apiKey, prompt)

  // 3. Parse JSON
  const jsonStr = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
  const parsed = JSON.parse(jsonStr)

  // 4. Generate thumbnail
  const imagePrompt = parsed.imagePrompt || parsed.title
  const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`

  return {
    ...parsed,
    imageUrl,
  }
}

/**
 * Analyzes a YouTube video OR generates content from a title,
 * extracts transcript (if video), generates sermon notes/title/description,
 * generates a thumbnail image, and saves as a draft.
 */
export async function analyzeSermonVideo(
  req: AnalyzeSermonRequest
): Promise<AnalyzeSermonResult> {
  try {
    const authResult = await requireRoles(ROLES.CONTENT)
    if ('error' in authResult) return { success: false, error: authResult.error }

    const videoUrl = req.videoUrl?.trim()
    const titleInput = req.title?.trim()

    if (!videoUrl && !titleInput) {
      return { success: false, error: 'Either video URL or sermon title is required' }
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { success: false, error: 'Gemini AI is not configured.' }

    // 1. Get content source
    let contentSource = ''
    const sourceType: 'video' | 'title' = videoUrl ? 'video' : 'title'

    if (sourceType === 'video') {
      try {
        const videoIdMatch = videoUrl?.match(
          /(?:v=|\/embed\/|\/watch\?v=|\/v\/|\/e\/|watch\?.*v=|^youtube\..*\/v\/|^youtu\.be\/|youtu\.be\/)([^#&?]*).*/
        )
        const videoId = videoIdMatch ? videoIdMatch[1] : videoUrl
        console.log('[sermon-ai] Fetching transcript for ID:', videoId)
        const items = await YoutubeTranscript.fetchTranscript(videoId!)
        contentSource = items.map((i) => i.text).join(' ')
      } catch (e) {
        console.error('[sermon-ai] transcript fetch failed:', e)
        return {
          success: false,
          error:
            'Could not fetch transcript from this video. Make sure it has captions enabled, or use "From Title" instead.',
        }
      }

      if (!contentSource || contentSource.length < 100) {
        return {
          success: false,
          error: 'Transcript is too short to analyze. Try a different video or use "From Title".',
        }
      }
    } else {
      contentSource = titleInput!
    }

    // 2. Generate Draft
    const draft = await generateSermonDraft(apiKey, sourceType, contentSource)

    // 3. Pick next Sunday
    const nextSunday = new Date()
    nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7))

    const slug = draft.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const sermonData = {
      title: draft.title,
      slug,
      description: draft.description,
      content: draft.html,
      video_url: videoUrl || '',
      preacher: 'Bishop Climate Wiseman',
      date: nextSunday.toISOString().split('T')[0],
      status: 'draft' as const,
      thumbnail_url: draft.imageUrl,
      featured_image_alt: draft.title,
      focus_keyword: draft.focusKeyword,
      meta_title: draft.title,
      meta_description: draft.description,
    }

    const dbResult = await createSermon(sermonData)
    if ('error' in dbResult) return { success: false, error: dbResult.error }

    return { success: true, id: dbResult.id }
  } catch (err: any) {
    console.error('[sermon-ai] unexpected error:', err)
    return { success: false, error: err.message || 'An unexpected error occurred during AI analysis.' }
  }
}

/**
 * Rewrites an existing sermon based on its title
 */
export async function rewriteSermonWithAi(
  sermonId: string,
  title: string
): Promise<AnalyzeSermonResult> {
  try {
    const authResult = await requireRoles(ROLES.CONTENT)
    if ('error' in authResult) return { success: false, error: authResult.error }

    if (!title?.trim()) {
      return { success: false, error: 'Sermon title is required' }
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { success: false, error: 'Gemini AI is not configured.' }

    // 1. Generate Draft from title
    const draft = await generateSermonDraft(apiKey, 'title', title)

    // 2. Get existing sermon to preserve preacher/date/slug
    const { updateSermon } = await import('./sermons')
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('sermons')
      .select('*')
      .eq('id', sermonId)
      .single()

    if (!existing) return { success: false, error: 'Sermon not found' }

    // 3. Update existing sermon
    const sermonData = {
      ...existing,
      title: draft.title,
      description: draft.description,
      content: draft.html,
      status: 'draft' as const,
      thumbnail_url: draft.imageUrl,
      featured_image_alt: draft.title,
      focus_keyword: draft.focusKeyword,
      meta_title: draft.title,
      meta_description: draft.description,
    }

    const dbResult = await updateSermon(sermonId, sermonData)
    if ('error' in dbResult) return { success: false, error: dbResult.error }

    return { success: true, id: sermonId }
  } catch (err: any) {
    console.error('[sermon-ai] rewrite error:', err)
    return { success: false, error: err.message || 'An unexpected error occurred during AI rewrite.' }
  }
}
