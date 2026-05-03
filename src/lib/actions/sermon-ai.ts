'use server'

import { YoutubeTranscript } from 'youtube-transcript'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'
import { createSermon } from './sermons'

export interface AnalyzeSermonRequest {
  videoUrl: string
}

export interface AnalyzeSermonResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Analyzes a YouTube video, extracts transcript, generates sermon notes/title/description,
 * generates a placeholder/AI image, and saves as a draft.
 */
export async function analyzeSermonVideo(
  req: AnalyzeSermonRequest
): Promise<AnalyzeSermonResult> {
  try {
    const authResult = await requireRoles(ROLES.CONTENT)
    if ('error' in authResult) return { success: false, error: authResult.error }

    const videoUrl = req.videoUrl.trim()
    if (!videoUrl) return { success: false, error: 'Video URL is required' }

    // 1. Get Transcript
    let transcript = ''
    try {
      const items = await YoutubeTranscript.fetchTranscript(videoUrl)
      transcript = items.map((i) => i.text).join(' ')
    } catch (e) {
      console.error('[analyzeSermonVideo] transcript fetch failed:', e)
      return { success: false, error: 'Failed to fetch transcript from this video. Ensure it has captions enabled.' }
    }

    if (!transcript || transcript.length < 100) {
      return { success: false, error: 'Transcript is too short to analyze.' }
    }

    // 2. AI Analysis (Gemini)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { success: false, error: 'Gemini AI is not configured.' }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
      You are an expert sermon editor for Kingdom Deliverance Centre Uganda (KDC Uganda).
      I will provide a transcript from a Christian sermon video.
      Your task is to analyze it and generate:
      1. A powerful, catchy sermon title.
      2. A short, engaging 2-sentence description/excerpt.
      3. Well-structured sermon notes in HTML format (Intro, 3 Biblical Points, Closing Prayer).
      4. A suggested focus keyword (1-2 words).
      5. A prompt for an AI image generator that captures the essence of this sermon (e.g. "A powerful illustration of divine healing in a modern African setting").

      Return the result as a VALID JSON object with these keys: title, description, html, focusKeyword, imagePrompt.

      Transcript:
      ${transcript.slice(0, 30000)} // Limit to ~30k chars for token safety
    `

    const aiResult = await model.generateContent(prompt)
    const responseText = aiResult.response.text()
    
    // Clean JSON response (sometimes AI wraps in ```json)
    const jsonStr = responseText.replace(/```json/i, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(jsonStr)

    // 3. Generate "AI" Image (using pollinations.ai for instant result)
    const imagePrompt = parsed.imagePrompt || parsed.title
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`

    // 4. Create Sermon Draft
    const nextSunday = new Date()
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7)
    if (nextSunday.getDay() === 0 && new Date().getHours() > 12) {
      // If it's already Sunday afternoon, pick next Sunday
      nextSunday.setDate(nextSunday.getDate() + 7)
    }

    const slug = parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    const sermonData = {
      title: parsed.title,
      slug: slug,
      description: parsed.description,
      content: parsed.html,
      video_url: videoUrl,
      preacher: 'Bishop Climate Wiseman', // Default
      date: nextSunday.toISOString().split('T')[0],
      status: 'draft' as const,
      thumbnail_url: imageUrl,
      featured_image_alt: parsed.title,
      focus_keyword: parsed.focusKeyword,
      meta_title: parsed.title,
      meta_description: parsed.description,
    }

    const dbResult = await createSermon(sermonData)

    if ('error' in dbResult) {
      return { success: false, error: dbResult.error }
    }

    return { success: true, id: dbResult.id }

  } catch (err: any) {
    console.error('[analyzeSermonVideo] unexpected error:', err)
    return { success: false, error: err.message || 'An unexpected error occurred during AI analysis.' }
  }
}
