import type { AiGenerateResult } from '@/lib/actions/ai'
import { generateSlug } from '@/lib/utils'

export interface ApplyAiSeoHandlers {
  setContent?: (html: string) => void
  /** Blog excerpt or ministry short summary */
  setSummary?: (text: string) => void
  setFocusKeyword?: (v: string) => void
  setMetaTitle?: (v: string) => void
  setMetaDescription?: (v: string) => void
  setSlug?: (v: string) => void
}

/** Apply AI-generated body + full SEO fields (used by all AI Assist editors). */
export function applyAiSeoFields(result: AiGenerateResult, handlers: ApplyAiSeoHandlers) {
  if (result.html && handlers.setContent) handlers.setContent(result.html)
  if (result.excerpt && handlers.setSummary) handlers.setSummary(result.excerpt)
  if (result.focusKeyword && handlers.setFocusKeyword) handlers.setFocusKeyword(result.focusKeyword)
  if (result.seoTitle && handlers.setMetaTitle) handlers.setMetaTitle(result.seoTitle)
  if (result.metaDescription && handlers.setMetaDescription) {
    handlers.setMetaDescription(result.metaDescription)
  }
  if (handlers.setSlug) {
    if (result.slug?.trim()) {
      handlers.setSlug(result.slug.trim().replace(/^\/+/, ''))
    } else if (result.focusKeyword?.trim()) {
      handlers.setSlug(generateSlug(result.focusKeyword))
    }
  }
}
