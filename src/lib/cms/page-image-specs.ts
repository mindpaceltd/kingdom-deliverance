import type { CmsPageType } from '@/lib/cms/page-content'

export interface PageImageSpec {
  /** Display label, e.g. "Hero background" */
  label: string
  width: number
  height: number
  aspectRatio: string
  /** Short note for editors */
  hint: string
}

/** Open Graph / social share image (all pages). */
export const OG_IMAGE_SPEC: PageImageSpec = {
  label: 'Social share image (Open Graph)',
  width: 1200,
  height: 630,
  aspectRatio: '1.91:1',
  hint: 'Used when this page is shared on WhatsApp, Facebook, X, and LinkedIn.',
}

/** Rich-text inline images in page body. */
export const BODY_IMAGE_SPEC: PageImageSpec = {
  label: 'Body content images',
  width: 1200,
  height: 0,
  aspectRatio: 'flexible',
  hint: 'Upload at least 1200px wide; height can vary. Compress before upload.',
}

const HERO_FULLSCREEN: PageImageSpec = {
  label: 'Homepage hero background',
  width: 1920,
  height: 1080,
  aspectRatio: '16:9',
  hint: 'Full-screen background behind the welcome headline. Center the subject; edges may crop on mobile.',
}

const HERO_INNER: PageImageSpec = {
  label: 'Page hero background',
  width: 1920,
  height: 800,
  aspectRatio: '12:5',
  hint: 'Wide banner behind the page title. Keep text-safe area in the center third.',
}

const HERO_LISTING: PageImageSpec = {
  label: 'Listing page hero background',
  width: 1920,
  height: 720,
  aspectRatio: '8:3',
  hint: 'Shorter hero for archive-style pages (blog, events, shop, etc.).',
}

const HERO_COMPACT: PageImageSpec = {
  label: 'Compact hero background',
  width: 1920,
  height: 600,
  aspectRatio: '16:5',
  hint: 'Smaller header for legal or text-heavy pages.',
}

export function getPageHeroImageSpec(pageType: CmsPageType): PageImageSpec {
  switch (pageType) {
    case 'home':
      return HERO_FULLSCREEN
    case 'listing':
      return HERO_LISTING
    case 'privacy':
    case 'terms':
      return HERO_COMPACT
    default:
      return HERO_INNER
  }
}

export function formatImageDimensions(spec: PageImageSpec): string {
  if (spec.height <= 0) {
    return `${spec.width}px+ wide`
  }
  return `${spec.width} × ${spec.height} px`
}
