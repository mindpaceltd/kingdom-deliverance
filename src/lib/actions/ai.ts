'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

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
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'Gemini API key is not configured.' }
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Strip any accidental markdown code fences
    const html = text
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    return { html }
  } catch (err) {
    console.error('[generatePostContent]', err)
    return { error: 'AI generation failed. Please try again.' }
  }
}
