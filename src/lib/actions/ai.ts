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
  excerpt?: string
  tags?: string[]
  focusKeyword?: string
  seoTitle?: string
  metaDescription?: string
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
    'gemini-2.0-flash-lite',
    'gemini-2.5-pro',
  ]

  let prompt: string

  if (req.mode === 'full') {
    prompt = `You are a professional content writer and SEO expert for Kingdom Deliverance Centre (KDC) Uganda, a Christian church website.

Write a complete, well-structured Christian blog post and all corresponding SEO metadata based on:
Title: ${req.title}
${req.excerpt ? `Provided summary/excerpt: ${req.excerpt}` : ''}
${req.focusKeyword ? `Requested focus keyword: ${req.focusKeyword}` : ''}

You MUST return a JSON object with the following fields:
- html: The complete, well-structured blog post body in HTML format. Write at least 400 words. Use proper HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>. Use modern Bible translations (NIV, ESV, NLT). Do NOT include <html>, <head>, <body> tags.
- excerpt: A highly engaging, brief summary (100-150 characters) suitable for blog list cards.
- tags: An array of 3 to 5 lowercase, highly relevant tags (e.g. ["faith", "prayer", "salvation"]).
- focusKeyword: A high-intent keyword or phrase (2-4 words) that is naturally integrated in the content.
- seoTitle: A search-optimized title (50-60 characters) that includes the focus keyword.
- metaDescription: A compelling, search-optimized meta description (150-160 characters) that includes the focus keyword.

Return ONLY the raw JSON object. Do not include markdown code blocks, do not include any text before or after the JSON.`
  } else if (req.mode === 'improve') {
    prompt = `You are a professional content editor and SEO specialist for Kingdom Deliverance Centre (KDC) Uganda.

Improve, rewrite, and expand the following blog post content to make it more faith-filled, engaging, and well-structured. Also optimize all corresponding SEO metadata.
Title: ${req.title}
${req.focusKeyword ? `Focus keyword: ${req.focusKeyword}` : ''}

Original Content:
${req.existingContent}

You MUST return a JSON object with the following fields:
- html: The improved, fully expanded post content in HTML format. Write at least 400 words. Use proper HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>. Use modern Bible translations (NIV, ESV, NLT).
- excerpt: A refined, highly engaging summary (100-150 characters) of the improved content.
- tags: An array of 3 to 5 lowercase, highly relevant tags.
- focusKeyword: A high-intent keyword or phrase (2-4 words) that is naturally integrated.
- seoTitle: A search-optimized title (50-60 characters) that includes the focus keyword.
- metaDescription: A compelling, search-optimized meta description (150-160 characters) that includes the focus keyword.

Return ONLY the raw JSON object. Do not include markdown code blocks, do not include any text before or after the JSON.`
  } else if (req.mode === 'sermon_full') {
    prompt = `You are an anointed sermon transcriber, editor, and SEO specialist for Kingdom Deliverance Centre (KDC) Uganda.

Write a complete, well-structured sermon transcript or detailed notes and all corresponding SEO metadata based on:
Title: ${req.title}
${req.excerpt ? `Provided summary/excerpt: ${req.excerpt}` : ''}
${req.focusKeyword ? `Key Verse/Keyword: ${req.focusKeyword}` : ''}

You MUST return a JSON object with the following fields:
- html: The complete sermon notes in HTML format. Write at least 500 words. Structure with an Introduction, 3 powerful Biblical Points with scripture references, and a Closing Prayer/Call to Action. Use proper HTML tags.
- excerpt: A powerful summary/excerpt (100-150 characters) outlining the core message of the sermon.
- focusKeyword: A high-intent keyword or key scripture reference (2-4 words) that represents the message.
- seoTitle: A search-optimized title (50-60 characters) suitable for indexation.
- metaDescription: A compelling, search-optimized meta description (150-160 characters) that includes the focus keyword.

Return ONLY the raw JSON object. Do not include markdown code blocks, do not include any text before or after the JSON.`
  } else {
    // sermon_improve
    prompt = `You are a professional sermon editor and SEO specialist for Kingdom Deliverance Centre (KDC) Uganda.

Improve and expand the following sermon notes or transcript to add more spiritual depth, detail, and Biblical structure. Also optimize all corresponding SEO metadata.
Title: ${req.title}
${req.focusKeyword ? `Key Verse/Keyword: ${req.focusKeyword}` : ''}

Original Content:
${req.existingContent}

You MUST return a JSON object with the following fields:
- html: The improved, fully expanded sermon content in HTML format. Write at least 500 words. Use proper HTML tags.
- excerpt: A refined, highly engaging summary (100-150 characters) of the improved sermon.
- focusKeyword: A high-intent keyword or key verse (2-4 words).
- seoTitle: A search-optimized title (50-60 characters).
- metaDescription: A compelling, search-optimized meta description (150-160 characters).

Return ONLY the raw JSON object. Do not include markdown code blocks, do not include any text before or after the JSON.`
  }

  try {
    let lastError = ''

    for (const modelName of MODEL_CHAIN) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        })
        const result = await model.generateContent(prompt)
        const text = result.response.text()

        let cleaned = text.trim()
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```json\s*/i, '')
          cleaned = cleaned.replace(/^```\s*/i, '')
          cleaned = cleaned.replace(/\s*```$/i, '')
          cleaned = cleaned.trim()
        }

        try {
          const parsed = JSON.parse(cleaned)
          return {
            html: parsed.html || '',
            excerpt: parsed.excerpt || '',
            tags: parsed.tags || [],
            focusKeyword: parsed.focusKeyword || '',
            seoTitle: parsed.seoTitle || '',
            metaDescription: parsed.metaDescription || '',
          }
        } catch (jsonErr) {
          console.warn('[generatePostContent] failed to parse JSON, falling back to raw html:', jsonErr)
          return { html: text }
        }
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
