/**
 * Production-ready AI service with fallback chain
 * Handles model availability, retries, and graceful degradation
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// Model chain: try in order until one works.
// Ordered by availability/reliability — if one is overloaded, move to the next.
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-pro',
] as const

type GeminiModel = typeof GEMINI_MODELS[number]

interface GenerateOptions {
  prompt: string
  maxRetries?: number
  timeout?: number
}

interface GenerateResult {
  success: boolean
  text?: string
  error?: string
  modelUsed?: string
}

/**
 * Classify an error to decide whether to retry the same model or skip to next.
 */
function classifyError(msg: string): 'skip_model' | 'retry' | 'fatal' {
  // Model not found — skip immediately
  if (msg.includes('404') || msg.includes('Not Found') || msg.includes('not found')) {
    return 'skip_model'
  }
  // Overloaded / rate limited — skip to next model
  if (
    msg.includes('503') ||
    msg.includes('Service Unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('Too Many Requests') ||
    msg.includes('RESOURCE_EXHAUSTED')
  ) {
    return 'skip_model'
  }
  // Transient network errors — worth retrying same model
  if (
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('fetch failed') ||
    msg.includes('network')
  ) {
    return 'retry'
  }
  // Everything else — retry once then skip
  return 'retry'
}

/**
 * Sleep for ms milliseconds
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate content with automatic model fallback and smart retry logic.
 * On 503/429/overload: immediately tries the next model.
 * On transient errors: retries the same model with backoff.
 */
export async function generateWithFallback(
  options: GenerateOptions
): Promise<GenerateResult> {
  const { prompt, maxRetries = 2, timeout = 90000 } = options

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { success: false, error: 'Gemini API key not configured' }
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  let lastError = 'All AI models failed'

  for (const modelName of GEMINI_MODELS) {
    console.log(`[AI Service] Trying model: ${modelName}`)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )

        const result = await Promise.race([
          model.generateContent(prompt),
          timeoutPromise,
        ])

        const text = result.response.text()

        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from AI')
        }

        console.log(`[AI Service] ✅ Success with ${modelName} (attempt ${attempt})`)
        return { success: true, text, modelUsed: modelName }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        lastError = errorMsg
        console.log(`[AI Service] ❌ ${modelName} attempt ${attempt}/${maxRetries}: ${errorMsg.slice(0, 120)}`)

        const action = classifyError(errorMsg)

        if (action === 'skip_model') {
          console.log(`[AI Service] Skipping ${modelName} → trying next model`)
          break // exit retry loop, move to next model
        }

        // retry — wait with exponential backoff before next attempt
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000)
          console.log(`[AI Service] Retrying in ${delay}ms...`)
          await sleep(delay)
        }
      }
    }
  }

  return { success: false, error: `AI unavailable: ${lastError.slice(0, 200)}` }
}

/**
 * Generate sermon content from transcript
 */
export async function generateSermonFromTranscript(
  transcript: string
): Promise<GenerateResult> {
  const truncated = transcript.slice(0, 30000)

  const prompt = `
You are an expert sermon editor for Kingdom Deliverance Centre Uganda (KDC Uganda).
Analyze this sermon transcript and generate:
1. A powerful, catchy sermon title
2. A short, engaging 2-sentence description
3. Well-structured sermon notes in HTML format (Intro, 3 Biblical Points, Closing Prayer)
4. A suggested focus keyword (1-2 words)
5. A prompt for an AI image generator

Return as VALID JSON with keys: title, description, html, focusKeyword, imagePrompt

Transcript:
${truncated}
  `.trim()

  return generateWithFallback({ prompt, timeout: 120000 })
}

/**
 * Generate sermon content from title only
 */
export async function generateSermonFromTitle(
  title: string
): Promise<GenerateResult> {
  const prompt = `
You are an expert sermon writer for Kingdom Deliverance Centre Uganda (KDC Uganda).
Create a complete, powerful sermon based on this title: "${title}"

Generate:
1. Use the provided title as-is
2. Write a short, engaging 2-sentence description
3. Create well-structured sermon notes in HTML format with:
   - Introduction (set context, hook audience)
   - 3 Main Biblical Points (with scripture, explanations, applications)
   - Closing Prayer (powerful, faith-building)
4. Suggest a focus keyword (1-2 words)
5. Create an AI image prompt

Make it biblically sound, culturally relevant to Uganda, and spiritually powerful.

Return as VALID JSON with keys: title, description, html, focusKeyword, imagePrompt
  `.trim()

  return generateWithFallback({ prompt, timeout: 120000 })
}

/**
 * Parse JSON response from AI (handles markdown code blocks)
 */
export function parseAIResponse(text: string): any {
  try {
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('[AI Service] Failed to parse JSON:', error)
    throw new Error('Failed to parse AI response as JSON')
  }
}
