/**
 * Production-ready AI service with fallback chain
 * Handles model availability, retries, and graceful degradation
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// Model chain: try in order until one works
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
] as const

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
 * Generate content with automatic model fallback
 */
export async function generateWithFallback(
  options: GenerateOptions
): Promise<GenerateResult> {
  const { prompt, maxRetries = 3, timeout = 60000 } = options
  
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      success: false,
      error: 'Gemini API key not configured',
    }
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  let lastError: Error | null = null

  // Try each model in the chain
  for (const modelName of GEMINI_MODELS) {
    console.log(`[AI Service] Trying model: ${modelName}`)
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        })
        
        // Race between generation and timeout
        const result = await Promise.race([
          model.generateContent(prompt),
          timeoutPromise,
        ])
        
        const text = result.response.text()
        
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from AI')
        }
        
        console.log(`[AI Service] ✅ Success with ${modelName} (attempt ${attempt})`)
        
        return {
          success: true,
          text,
          modelUsed: modelName,
        }
      } catch (error) {
        lastError = error as Error
        const errorMsg = error instanceof Error ? error.message : String(error)
        
        console.log(
          `[AI Service] ❌ ${modelName} attempt ${attempt}/${maxRetries} failed:`,
          errorMsg
        )
        
        // If it's a 404 (model not found), don't retry this model
        if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
          console.log(`[AI Service] Model ${modelName} not available, trying next...`)
          break
        }
        
        // If it's a quota error, try next model immediately
        if (errorMsg.includes('quota') || errorMsg.includes('429')) {
          console.log(`[AI Service] Quota exceeded for ${modelName}, trying next...`)
          break
        }
        
        // For other errors, wait before retry
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
  }

  // All models failed
  return {
    success: false,
    error: lastError?.message || 'All AI models failed',
  }
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

  return generateWithFallback({ prompt, timeout: 90000 })
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

  return generateWithFallback({ prompt, timeout: 90000 })
}

/**
 * Parse JSON response from AI (handles markdown code blocks)
 */
export function parseAIResponse(text: string): any {
  try {
    // Remove markdown code blocks if present
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
