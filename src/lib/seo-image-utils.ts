/**
 * SEO Image Utilities - Ensures proper social sharing images
 */

export function generateSeoImage(
  title: string,
  description?: string,
  type: 'blog' | 'sermon' | 'event' | 'ministry' | 'product' | 'default' = 'default'
): string {
  const baseUrl = 'https://kdcuganda.org'
  const encodedTitle = encodeURIComponent(title.substring(0, 60))
  const encodedDesc = encodeURIComponent(description?.substring(0, 100) || '')
  
  // Use branded OG image generator with fallback
  return `${baseUrl}/og?title=${encodedTitle}&description=${encodedDesc}&type=${type}`
}

export function getOptimizedImage(
  fallbackTitle: string,
  imageUrl?: string | null,
  fallbackDescription?: string,
  type: 'blog' | 'sermon' | 'event' | 'ministry' | 'product' | 'default' = 'default'
): string {
  // If no image or using placeholder images, generate dynamic SEO image
  if (!imageUrl || imageUrl.includes('pollinations.ai') || imageUrl.includes('unsplash')) {
    return generateSeoImage(fallbackTitle, fallbackDescription, type)
  }
  
  // Fully qualify relative URLs for social scrapers
  if (!imageUrl.startsWith('http')) {
    return `https://kdcuganda.org${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
  }
  
  return imageUrl
}

export function createSocialImageMetadata(
  title: string,
  description: string,
  imageUrl?: string | null,
  type: 'blog' | 'sermon' | 'event' | 'ministry' | 'product' | 'default' = 'default'
) {
  const optimizedImage = getOptimizedImage(title, imageUrl, description, type)
  
  return {
    url: optimizedImage,
    width: 1200,
    height: 630,
    alt: title,
    type: 'image/jpeg' as const
  }
}
