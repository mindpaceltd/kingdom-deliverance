import { createClient } from '@/lib/supabase/server'
import { normalizeMediaUrl } from '@/lib/media-url'
import { toAbsoluteSocialImageUrl } from '@/lib/seo-image-utils'

const DEFAULT_OG =
  'https://images.unsplash.com/photo-1493397212122-2b85dda8106b?q=80&w=2071&auto=format&fit=crop'

/** Organization OG image for social previews (organization_images → site_settings). */
export async function getOrgOgImageUrl(): Promise<string> {
  try {
    const supabase = createClient()
    const [orgImage, settings] = await Promise.all([
      supabase
        .from('organization_images')
        .select('url')
        .eq('type', 'og_image')
        .eq('is_active', true)
        .maybeSingle(),
      supabase.from('site_settings').select('value').eq('key', 'site_og_image').maybeSingle(),
    ])

    const raw = orgImage.data?.url || settings.data?.value
    return toAbsoluteSocialImageUrl(raw) || DEFAULT_OG
  } catch {
    return DEFAULT_OG
  }
}

/** Organization logo URL for JSON-LD publisher/organizer blocks. */
export async function getOrgLogoUrl(): Promise<string> {
  try {
    const supabase = createClient()
    const [orgLogo, settings] = await Promise.all([
      supabase
        .from('organization_images')
        .select('url')
        .eq('type', 'logo')
        .eq('is_active', true)
        .maybeSingle(),
      supabase.from('site_settings').select('value').eq('key', 'site_logo').maybeSingle(),
    ])

    const raw = orgLogo.data?.url || settings.data?.value
    const normalized = normalizeMediaUrl(raw)
    if (!normalized) return 'https://kdcuganda.org/logo.png'
    return toAbsoluteSocialImageUrl(normalized) || normalized
  } catch {
    return 'https://kdcuganda.org/logo.png'
  }
}

export async function getSiteName(): Promise<string> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'site_name')
      .maybeSingle()
    return data?.value || 'Kingdom Deliverance Centre Uganda'
  } catch {
    return 'Kingdom Deliverance Centre Uganda'
  }
}
