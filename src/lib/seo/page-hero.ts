import { createClient } from '@/lib/supabase/server'
import { normalizeMediaUrl } from '@/lib/media-url'

/** Warm worship / community — readable behind white headline text */
export const DEFAULT_ABOUT_HERO_URL =
  'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop'

const HERO_TYPES_ABOUT = ['church_building', 'leadership'] as const

/**
 * About page hero: prefer church building or leadership photos, not the site-wide
 * "hero" slot (often an abstract texture unsuitable for this section).
 */
export async function getAboutHeroUrl(): Promise<string> {
  try {
    const supabase = createClient()

    for (const type of HERO_TYPES_ABOUT) {
      const { data, error } = await supabase
        .from('organization_images')
        .select('url')
        .eq('type', type)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.error(`[getAboutHeroUrl] ${type} fetch failed:`, error.message)
        continue
      }

      const normalized = normalizeMediaUrl(data?.url)
      if (normalized) return normalized
    }
  } catch (err) {
    console.error('[getAboutHeroUrl] Unexpected error:', err)
  }

  return DEFAULT_ABOUT_HERO_URL
}

const HERO_TYPES_EVENTS = ['church_building', 'leadership'] as const

/**
 * Events listing hero: featured/upcoming event poster, then org photos, then worship fallback.
 */
export async function getEventsHeroUrl(
  events?: { is_featured?: boolean; image_url?: string | null }[]
): Promise<string> {
  const featured = events?.find((e) => e.is_featured && e.image_url)
  const withImage = events?.find((e) => e.image_url)
  for (const candidate of [featured, withImage]) {
    const normalized = normalizeMediaUrl(candidate?.image_url)
    if (normalized) return normalized
  }

  try {
    const supabase = createClient()
    for (const type of HERO_TYPES_EVENTS) {
      const { data, error } = await supabase
        .from('organization_images')
        .select('url')
        .eq('type', type)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.error(`[getEventsHeroUrl] ${type} fetch failed:`, error.message)
        continue
      }

      const normalized = normalizeMediaUrl(data?.url)
      if (normalized) return normalized
    }
  } catch (err) {
    console.error('[getEventsHeroUrl] Unexpected error:', err)
  }

  return DEFAULT_ABOUT_HERO_URL
}
