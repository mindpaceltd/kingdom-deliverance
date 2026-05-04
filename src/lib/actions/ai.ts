'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

export type AiGenerateMode = 'full' | 'improve' | 'sermon_full' | 'sermon_improve'

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

  // Try models in order — skip immediately on 503/429/overload
  const MODEL_CHAIN = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash-002',
    'gemini-1.5-pro-002',
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
  } else if (req.mode === 'improve') {
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
  } else if (req.mode === 'sermon_full') {
    prompt = `You are a professional sermon transcriber and editor for KDC Uganda.

Write a well-structured sermon transcript or detailed notes in HTML format for the following:

Title: ${req.title}
${req.excerpt ? `Summary: ${req.excerpt}` : ''}
${req.focusKeyword ? `Key Verse/Keyword: ${req.focusKeyword}` : ''}

Requirements:
- Write at least 500 words
- Use proper HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>
- Structure: Introduction, 3 Biblical Points with scripture references (placeholder), and a Closing Prayer/Call to Action
- Write in a warm, powerful, anointed tone appropriate for a sermon
- Return ONLY the HTML content, no markdown, no code fences`
  } else {
    // sermon_improve
    prompt = `You are a professional sermon editor for KDC Uganda.

Improve and expand the following sermon notes or transcript. Make it more powerful, better structured, and more detailed.

Title: ${req.title}
${req.focusKeyword ? `Key Verse/Keyword: ${req.focusKeyword}` : ''}

Existing content:
${req.existingContent}

Requirements:
- Expand to at least 500 words
- Use proper HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>
- Enhance the spiritual depth and biblical flow
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
        console.warn(`[generatePostContent] model ${modelName} failed:`, msg.slice(0, 120))

        // Skip to next model on: overload, quota, not found
        if (
          msg.includes('503') || msg.includes('Service Unavailable') ||
          msg.includes('overloaded') || msg.includes('high demand') ||
          msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests') ||
          msg.includes('404') || msg.includes('not found') || msg.includes('Not Found') ||
          msg.includes('RESOURCE_EXHAUSTED')
        ) {
          continue
        }
        // Any other error — stop trying
        break
      }
    }

    // All models failed
    if (
      lastError.includes('503') || lastError.includes('overloaded') ||
      lastError.includes('high demand') || lastError.includes('429') ||
      lastError.includes('quota')
    ) {
      return { error: 'AI is currently busy. Please try again in a moment.' }
    }
    return { error: `AI generation failed: ${lastError.slice(0, 200)}` }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generatePostContent] unexpected error:', message)
    return { error: `AI generation failed: ${message}` }
  }
}
