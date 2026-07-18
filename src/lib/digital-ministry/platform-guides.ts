import type { DmPlatform } from '@/lib/digital-ministry/types'

export type PlatformGuide = {
  id: DmPlatform
  label: string
  accent: string
  softBg: string
  charLimit: number
  softLimit?: number
  recommendations: string[]
  previewHint: string
}

export const DM_PLATFORM_GUIDES: Record<string, PlatformGuide> = {
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    accent: '#1877F2',
    softBg: '#E7F0FD',
    charLimit: 63206,
    softLimit: 500,
    recommendations: [
      'Lead with a hook in the first 125 characters (before “See more”).',
      'Ask one clear question or CTA (Visit · Pray · Watch).',
      '1–3 relevant hashtags max; line breaks help readability.',
      'Best times for KDC: Sunday afternoon and mid-week evenings (EAT).',
    ],
    previewHint: 'Page / feed post card',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    accent: '#E4405F',
    softBg: '#FDEcef',
    charLimit: 2200,
    softLimit: 300,
    recommendations: [
      'Caption works best with a strong first line; media is required to publish.',
      'Use 3–8 hashtags (faith + Uganda + ministry), not a wall of tags.',
      'Reels / carousels outperform plain text — attach an image or clip.',
      'Add a clear CTA: “Save · Share · Tag someone to pray with”.',
    ],
    previewHint: 'Caption under post',
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    accent: '#FF0000',
    softBg: '#FFE5E5',
    charLimit: 5000,
    softLimit: 200,
    recommendations: [
      'Title ≤ ~70 characters; put the keyword early.',
      'Description: first 2 lines matter in search results.',
      'Include service time, scripture, and link to kdcuganda.org.',
      'Shorts ideas: one punchy sentence + verse reference.',
    ],
    previewHint: 'Title + description',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    accent: '#010101',
    softBg: '#F3F3F3',
    charLimit: 2200,
    softLimit: 150,
    recommendations: [
      'Hook in the first 3 seconds / first line of caption.',
      'Keep captions short; put the sermon punchline up front.',
      '1–4 hashtags; avoid spammy stacks.',
      'Vertical video / clip required for native publish.',
    ],
    previewHint: 'Caption under clip',
  },
  x: {
    id: 'x',
    label: 'X',
    accent: '#0F1419',
    softBg: '#EEF1F4',
    charLimit: 280,
    recommendations: [
      'Hard 280-character limit — trim aggressively.',
      'One idea per post; thread longer teaching.',
      '1–2 hashtags; link in replies if needed.',
      'Strong opening verb works well for outreach.',
    ],
    previewHint: 'Tweet card',
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    accent: '#0A66C2',
    softBg: '#E8F1FA',
    charLimit: 3000,
    softLimit: 600,
    recommendations: [
      'Professional tone; leadership / workplace faith angles land well.',
      'Short paragraphs with white space; first 210 chars show before “see more”.',
      'End with a reflective question for comments.',
      'Avoid heavy emoji stacks and slang.',
    ],
    previewHint: 'Feed update',
  },
  website: {
    id: 'website',
    label: 'Website / Blog',
    accent: '#0F766E',
    softBg: '#E6F4F1',
    charLimit: 100000,
    softLimit: 160,
    recommendations: [
      'Use as excerpt / teaser for the full blog or sermon page.',
      'Include a clear link CTA to the sermon or article.',
      'SEO: keep focus keyword in the first sentence when possible.',
    ],
    previewHint: 'Card / excerpt',
  },
  email: {
    id: 'email',
    label: 'Newsletter',
    accent: '#7C3AED',
    softBg: '#F3E8FF',
    charLimit: 100000,
    softLimit: 400,
    recommendations: [
      'Subject-style title + warm pastoral greeting.',
      'One primary CTA button idea (Watch · Pray · Give · Visit).',
      'Keep mobile length in mind — short paragraphs.',
      'Sign off as Kingdom Deliverance Centre Uganda.',
    ],
    previewHint: 'Email body',
  },
}

export function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function trimForPlatform(text: string, platform: string, enabled: boolean): string {
  const guide = DM_PLATFORM_GUIDES[platform]
  if (!enabled || !guide) return text
  if (text.length <= guide.charLimit) return text
  const cut = text.slice(0, Math.max(0, guide.charLimit - 1)).trimEnd()
  return `${cut}…`
}

export function platformCaption(
  title: string,
  bodyHtml: string,
  platform: string,
  overrides?: Record<string, string>,
  trim = true
): string {
  if (overrides?.[platform]?.trim()) {
    return trimForPlatform(overrides[platform].trim(), platform, trim)
  }
  const plain = htmlToPlain(bodyHtml)
  const combined = [title.trim(), plain].filter(Boolean).join('\n\n')
  return trimForPlatform(combined, platform, trim)
}
