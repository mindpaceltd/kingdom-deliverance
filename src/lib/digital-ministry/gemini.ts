import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'

const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-pro',
]

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseGeminiJson<T>(text: string): T {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
  }
  return JSON.parse(cleaned) as T
}

export async function generateGeminiJson<T>(params: {
  prompt: string
  agent: string
  userId?: string | null
  inputType?: string
  inputRef?: string | null
}): Promise<{ data: T; model: string } | { error: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { error: 'GEMINI_API_KEY is not configured' }

  const genAI = new GoogleGenerativeAI(apiKey)
  let lastError = 'Gemini request failed'

  for (const modelName of MODEL_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(params.prompt)
      const text = result.response.text()
      const data = parseGeminiJson<T>(text)

      try {
        const admin = createAdminClient()
        await admin.from('dm_ai_generations').insert({
          agent: params.agent,
          input_type: params.inputType ?? null,
          input_ref: params.inputRef ?? null,
          prompt: params.prompt.slice(0, 6000),
          output: data as object,
          model: modelName,
          created_by: params.userId ?? null,
        })
      } catch (logErr) {
        console.warn('dm_ai_generations log failed', logErr)
      }

      return { data, model: modelName }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Gemini request failed'
      console.warn(`[dm-gemini] ${modelName}:`, lastError)
    }
  }

  return { error: lastError }
}
