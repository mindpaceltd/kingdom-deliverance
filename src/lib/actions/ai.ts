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
 * Resiliently parses JSON from Gemini, falling back to custom regex extraction 
 * if parsing fails due to unescaped control characters like literal newlines.
 */
export function parseResilientJson(text: string): AiGenerateResult {
  let cleaned = text.trim()
  
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '')
    cleaned = cleaned.replace(/^```html\s*/i, '')
    cleaned = cleaned.replace(/^```\s*/i, '')
    cleaned = cleaned.replace(/\s*```$/i, '')
    cleaned = cleaned.trim()
  }

  let html = ''
  let excerpt = ''
  let tags: string[] = []
  let focusKeyword = ''
  let seoTitle = ''
  let metaDescription = ''

  // Try standard JSON.parse first
  try {
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === 'object') {
      html = parsed.html || ''
      excerpt = parsed.excerpt || ''
      tags = Array.isArray(parsed.tags) ? parsed.tags : []
      focusKeyword = parsed.focusKeyword || ''
      seoTitle = parsed.seoTitle || ''
      metaDescription = parsed.metaDescription || ''
    }
  } catch (e) {
    console.warn('[parseResilientJson] Standard JSON parse failed, using resilient regex extractor:', e)
    
    // Fallback: Regex extraction for each field
    const extractField = (field: string): string => {
      const regex = new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)(?<!\\\\)"`, 'i')
      const match = cleaned.match(regex)
      if (match && match[1]) {
        return match[1]
          .replace(/\\"/g, '"')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          .trim()
      }
      return ''
    }

    const extractTags = (): string[] => {
      const regex = /"tags"\s*:\s*\[([\s\S]*?)\]/i
      const match = cleaned.match(regex)
      if (match && match[1]) {
        return match[1]
          .split(',')
          .map(t => t.replace(/"/g, '').trim())
          .filter(Boolean)
      }
      return []
    }

    html = extractField('html')
    excerpt = extractField('excerpt')
    tags = extractTags()
    focusKeyword = extractField('focusKeyword') || extractField('focus_keyword')
    seoTitle = extractField('seoTitle') || extractField('meta_title') || extractField('seo_title')
    metaDescription = extractField('metaDescription') || extractField('meta_description') || extractField('seo_description')
  }

  // If we couldn't even extract HTML and the string is not JSON, treat entire response as HTML
  if (!html && !cleaned.startsWith('{')) {
    html = cleaned
  }

  // Post-process HTML to clean up any escaped characters, literal '\n' sequences, or markdown blocks
  if (html) {
    // 1. Unescape any literal double-escaped backslash-n sequences if they leak as text
    html = html.replace(/\\n/g, '\n')
    
    // 2. Convert double-newlines to paragraph HTML if AI outputted plain text
    if (!html.includes('<p>') && !html.includes('</h2>') && !html.includes('</h3>')) {
      html = html
        .split('\n\n')
        .map(p => p.trim() ? `<p>${p.replace(/\n/g, '<br />')}</p>` : '')
        .filter(Boolean)
        .join('\n')
    } else {
      // Clean up excess spacing so it looks beautiful in TipTap
      html = html.replace(/\n\n+/g, '\n')
    }
    
    // 3. Strip any residual markdown blocks
    html = html.replace(/^```html\s*/i, '').replace(/\s*```$/i, '')
  }

  return {
    html: html.trim(),
    excerpt: excerpt.trim(),
    tags,
    focusKeyword: focusKeyword.trim(),
    seoTitle: seoTitle.trim(),
    metaDescription: metaDescription.trim(),
  }
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

CRITICAL INSTRUCTIONS:
1. Ensure the content and SEO are tailored to reflect KDC's roots in Uganda/Africa, but also highlight its global ministry, digital outreach, and impact to the rest of the world. Appeal to both a local African audience and a global international audience.
2. The 'html' field MUST contain only clean, well-structured, valid HTML.
   - EVERY paragraph must be wrapped in <p>...</p> tags.
   - Headings must be wrapped in <h2>...</h2> or <h3>...</h3>.
   - Lists must use <ul>/<li> or <ol>/<li>.
   - Do NOT output literal backslash-n sequences like '\\n' or '\\n\\n' inside the HTML. Use proper HTML tags.
   - Do NOT include <html>, <head>, <body>, or <title> tags.
   - Do NOT include any JSON delimiters or structure inside the HTML.

You MUST return a JSON object with the following fields:
- html: The complete, well-structured blog post body in clean HTML format. Write at least 400 words.
- excerpt: A highly engaging, brief summary (100-150 characters) suitable for blog list cards, reflecting KDC's global outreach.
- tags: An array of 3 to 5 lowercase, highly relevant tags (e.g. ["faith", "prayer", "salvation"]).
- focusKeyword: A high-intent keyword or phrase (2-4 words) that is naturally integrated in the content.
- seoTitle: A search-optimized title (50-60 characters) that includes the focus keyword and appeals globally.
- metaDescription: A compelling, search-optimized meta description (150-160 characters) that includes the focus keyword and highlights global ministry.

Return ONLY the raw JSON object. Do not include markdown code blocks, do not include any text before or after the JSON.`
  } else if (req.mode === 'improve') {
    prompt = `You are a professional content editor and SEO specialist for Kingdom Deliverance Centre (KDC) Uganda.

Improve, rewrite, and expand the following blog post content to make it more faith-filled, engaging, and well-structured. Also optimize all corresponding SEO metadata.
Title: ${req.title}
${req.focusKeyword ? `Focus keyword: ${req.focusKeyword}` : ''}

Original Content:
${req.existingContent}

CRITICAL INSTRUCTIONS:
1. Ensure the content and SEO are tailored to reflect KDC's roots in Uganda/Africa, but also highlight its global ministry, digital outreach, and impact to the rest of the world. Appeal to both a local African audience and a global international audience.
2. The 'html' field MUST contain only clean, well-structured, valid HTML.
   - EVERY paragraph must be wrapped in <p>...</p> tags.
   - Headings must be wrapped in <h2>...</h2> or <h3>...</h3>.
   - Lists must use <ul>/<li> or <ol>/<li>.
   - Do NOT output literal backslash-n sequences like '\\n' or '\\n\\n' inside the HTML. Use proper HTML tags.
   - Do NOT include <html>, <head>, <body>, or <title> tags.
   - Do NOT include any JSON delimiters or structure inside the HTML.

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

CRITICAL INSTRUCTIONS:
1. Ensure the content and SEO reflect KDC's roots in Uganda/Africa, but also highlight its global ministry and outreach to the rest of the world.
2. The 'html' field MUST contain only clean, well-structured, valid HTML.
   - EVERY paragraph must be wrapped in <p>...</p> tags.
   - Headings must be wrapped in <h2>...</h2> or <h3>...</h3>.
   - Do NOT output literal backslash-n sequences like '\\n' or '\\n\\n' inside the HTML. Use proper HTML tags.

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

CRITICAL INSTRUCTIONS:
1. Ensure the content and SEO reflect KDC's roots in Uganda/Africa, but also highlight its global ministry and outreach to the rest of the world.
2. The 'html' field MUST contain only clean, well-structured, valid HTML.
   - EVERY paragraph must be wrapped in <p>...</p> tags.
   - Headings must be wrapped in <h2>...</h2> or <h3>...</h3>.
   - Do NOT output literal backslash-n sequences like '\\n' or '\\n\\n' inside the HTML. Use proper HTML tags.

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

        return parseResilientJson(text)
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
