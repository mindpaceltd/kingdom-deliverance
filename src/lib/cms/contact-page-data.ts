import { createClient } from '@/lib/supabase/server'
import { parseStringArray } from '@/lib/settings-json'
import { parsePageContent, type CmsContactDetails, type CmsPageHero } from '@/lib/cms/page-content'
import { SYSTEM_PAGE_DEFINITIONS } from '@/lib/cms/system-pages'

const CONTACT_SYSTEM = SYSTEM_PAGE_DEFINITIONS.find((d) => d.slug === 'contact')!

export const DEFAULT_CONTACT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=2074&auto=format&fit=crop'

export function defaultContactDetails(): CmsContactDetails {
  return { ...(CONTACT_SYSTEM.content.contact ?? {}) }
}

export interface ResolvedContactPage {
  hero: Required<Pick<CmsPageHero, 'title'>> &
    Pick<CmsPageHero, 'badge' | 'subtitle' | 'imageUrl'>
  introHtml?: string
  findUsTitle: string
  address: string
  phones: string[]
  email: string
  serviceTimes: string
  mapEmbedUrl: string
  mapLinkUrl: string
  mapLinkLabel: string
  formTitle: string
  formSuccessTitle: string
  formSuccessMessage: string
  submitButtonLabel: string
}

function pickString(
  ...candidates: (string | undefined)[]
): string | undefined {
  for (const value of candidates) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

function mergePhones(
  contact: CmsContactDetails,
  settings: Record<string, string>
): string[] {
  const primary =
    pickString(contact.primaryPhone, settings.contact_phone) ??
    defaultContactDetails().primaryPhone ??
    '+256 700 000 000'

  const additional =
    contact.additionalPhones && contact.additionalPhones.length > 0
      ? contact.additionalPhones.filter((p) => p.trim())
      : parseStringArray(settings.contact_phones_json)

  return [primary, ...additional.filter((p) => p.trim())]
}

export function resolveContactPage(
  cmsContent: ReturnType<typeof parsePageContent> | null,
  settings: Record<string, string>,
  orgHeroUrl?: string | null
): ResolvedContactPage {
  const system = CONTACT_SYSTEM.content
  const base = cmsContent?.pageType === 'contact' ? cmsContent : system
  const contact: CmsContactDetails = {
    ...defaultContactDetails(),
    ...base.contact,
  }
  const hero: CmsPageHero = { ...system.hero, ...base.hero }
  const defaults = defaultContactDetails()

  const imageUrl =
    pickString(hero.imageUrl, orgHeroUrl ?? undefined) ?? DEFAULT_CONTACT_HERO_IMAGE

  return {
    hero: {
      badge: pickString(hero.badge, system.hero?.badge) ?? 'Get In Touch',
      title: pickString(hero.title, system.hero?.title) ?? 'Contact Us',
      subtitle:
        pickString(hero.subtitle, system.hero?.subtitle) ??
        'We would love to hear from you. Reach out with any questions, prayer requests, or to learn more about our church.',
      imageUrl,
    },
    introHtml: base.contactIntroHtml?.trim() || undefined,
    findUsTitle: pickString(contact.findUsTitle, defaults.findUsTitle) ?? 'Find Us',
    address:
      pickString(contact.address, settings.address, defaults.address) ??
      'Kingdom Deliverance Centre Uganda\nKampala, Uganda',
    phones: mergePhones(contact, settings),
    email:
      pickString(contact.email, settings.contact_email, defaults.email) ??
      'info@kdcuganda.org',
    serviceTimes:
      pickString(contact.serviceTimes, defaults.serviceTimes) ??
      'Sunday: 10:00 AM (EAT)\nWednesday: 6:00 PM (EAT)\nFriday: 6:00 PM (EAT)',
    mapEmbedUrl:
      pickString(contact.mapEmbedUrl, defaults.mapEmbedUrl) ??
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7573!2d32.5825!3d0.3136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177dbc0f9d74b39b%3A0x4099d33b10770b2!2sKingdom+Deliverance+Centre+Uganda!5e0!3m2!1sen!2sug!4v1714000000000',
    mapLinkUrl:
      pickString(contact.mapLinkUrl, defaults.mapLinkUrl) ??
      'https://maps.app.goo.gl/RrBd8tDxEDky8D6N7',
    mapLinkLabel:
      pickString(contact.mapLinkLabel, defaults.mapLinkLabel) ?? 'Open in Google Maps',
    formTitle: pickString(contact.formTitle, defaults.formTitle) ?? 'Send a Message',
    formSuccessTitle:
      pickString(contact.formSuccessTitle, defaults.formSuccessTitle) ?? 'Message Sent!',
    formSuccessMessage:
      pickString(contact.formSuccessMessage, defaults.formSuccessMessage) ??
      'Thank you for reaching out. We will get back to you as soon as possible.',
    submitButtonLabel:
      pickString(contact.submitButtonLabel, defaults.submitButtonLabel) ?? 'Send Message',
  }
}

export async function loadContactPageData(): Promise<ResolvedContactPage> {
  const supabase = await createClient()

  const [pageRes, settingsRes, heroRes] = await Promise.all([
    supabase
      .from('pages')
      .select('content_json')
      .eq('slug', 'contact')
      .eq('status', 'published')
      .maybeSingle(),
    supabase.from('site_settings').select('key, value'),
    supabase
      .from('organization_images')
      .select('url')
      .eq('type', 'hero')
      .eq('is_active', true)
      .maybeSingle(),
  ])

  const settings = Object.fromEntries(
    (settingsRes.data ?? []).map((row) => [row.key, row.value])
  )

  const cms = pageRes.data?.content_json
    ? parsePageContent(pageRes.data.content_json)
    : null

  return resolveContactPage(cms, settings, heroRes.data?.url ?? null)
}
