'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

export type AiGenerateMode = 'full' | 'improve'

export interface AiGenerateRequest {
  mode: AiGenerateMode
  title: string
  excerpt?: string
  existingContent?: string
  focusKeyword?: string
}

export interface AiGenerateResult {
  html: string
}

/**
 * Generates or improves post content using Gemini AI.
 *
 * mode = 'full'    → write a complete blog post from the title/excerpt
 * mode = 'improve' → rewrite/expand the existing content
 */
export async function generatePostContent(
  req: AiGenerateRequest
): Promise<AiGenerateResult | { error: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { error: 'Gemini API key is not configured on the server.' }
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  // Try models in order — fall back if one is unavailable or quota-exceeded
  const MODEL_CHAIN = [
    'gemini-1.5-flash',                     // most stable free tier
    'gemini-1.5-pro',                       // fallback
    'gemini-2.5-flash',                     // newer fallback
  ]

  let prompt: string

  if (req.mode === 'full') {
    prompt = `You are a professional content writer for KDC Uganda, a Christian church website.

Write a complete, well-structured blog post in HTML format for the following:

Title: ${req.title}
${req.excerpt ? `Summary: ${req.excerpt}` : ''}
${req.focusKeyword ? `Focus keyword (use naturally throughout): ${req.focusKeyword}` : ''}

Requirements:
- Write at least 400 words
- Use proper HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>
- Do NOT include <html>, <head>, <body>, or <title> tags — only the inner content
- Write in a warm, faith-based, inspiring tone appropriate for a church audience
- Include an introduction, 2-3 main sections with headings, and a conclusion
- Return ONLY the HTML content, no markdown, no code fences`
  } else {
    prompt = `You are a professional content editor for KDC Uganda, a Christian church website.

Improve and expand the following blog post content. Make it more engaging, better structured, and at least 400 words.

Title: ${req.title}
${req.focusKeyword ? `Focus keyword (use naturally): ${req.focusKeyword}` : ''}

Existing content:
${req.existingContent}

Requirements:
- Preserve the original meaning and key points
- Improve clarity, flow, and engagement
- Use proper HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>
- Do NOT include <html>, <head>, <body>, or <title> tags — only the inner content
- Write in a warm, faith-based, inspiring tone
- Return ONLY the HTML content, no markdown, no code fences`
  }

  try {
    let lastError = ''

    for (const modelName of MODEL_CHAIN) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        const text = result.response.text()

        // Strip any accidental markdown code fences
        const html = text
          .replace(/^```html\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim()

        return { html }
      } catch (modelErr: unknown) {
        const msg = modelErr instanceof Error ? modelErr.message : String(modelErr)
        lastError = msg
        console.warn(`[generatePostContent] model ${modelName} failed:`, msg)

        // If it's a quota error, try next model
        if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
          continue
        }
        // If it's a 404 (model not found), try next
        if (msg.includes('404') || msg.includes('not found')) {
          continue
        }
        // Any other error — stop trying
        break
      }
    }

    // All models failed
    if (lastError.includes('429') || lastError.includes('quota') || lastError.includes('Too Many Requests')) {
      return { error: 'AI quota limit reached. Please wait a minute and try again.' }
    }
    return { error: `AI generation failed: ${lastError}` }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generatePostContent] unexpected error:', message)
    return { error: `AI generation failed: ${message}` }
  }
}
