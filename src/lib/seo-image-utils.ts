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
  // If we have a stable, non-dynamic image URL, use it
  if (imageUrl && 
      !imageUrl.includes('pollinations.ai') && 
      !imageUrl.includes('unsplash') &&
      (imageUrl.startsWith('https://') || imageUrl.startsWith('http://'))) {
    return imageUrl
  }
  
  // Otherwise generate branded OG image
  return generateSeoImage(fallbackTitle, fallbackDescription, type)
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
