/**
 * Alt Text Optimization System
 * Ensures proper accessibility and SEO for images
 */

export interface AltTextOptions {
  title?: string
  description?: string
  contentType?: 'blog' | 'sermon' | 'event' | 'ministry' | 'product' | 'church'
  author?: string
  location?: string
  date?: string
}

export function generateOptimizedAltText(
  imageUrl?: string | null,
  options: AltTextOptions = {}
): string {
  const { title, description, contentType, author, location, date } = options

  // If we have a manual alt text, use it
  if (description && description.trim()) {
    return description.trim()
  }

  // Generate contextual alt text based on content type
  switch (contentType) {
    case 'blog':
      return title 
        ? `Featured image for blog post: ${title}`
        : 'Blog post featured image'
    
    case 'sermon':
      return title 
        ? `Sermon cover: ${title}${author ? ` by ${author}` : ''}`
        : 'Sermon cover image'
    
    case 'event':
      return title 
        ? `Event promotion: ${title}${location ? ` at ${location}` : ''}${date ? ` on ${date}` : ''}`
        : 'Event promotion image'
    
    case 'ministry':
      return title 
        ? `Ministry photo: ${title}`
        : 'Ministry photo'
    
    case 'product':
      return title 
        ? `Product image: ${title}`
        : 'Product image'
    
    case 'church':
      return title 
        ? `Kingdom Deliverance Centre Uganda: ${title}`
        : 'Kingdom Deliverance Centre Uganda church image'
    
    default:
      return title || 'Image'
  }
}

export function validateAltText(altText: string): {
  isValid: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []

  // Check length
  if (altText.length < 10) {
    issues.push('Alt text is too short (minimum 10 characters recommended)')
    suggestions.push('Add more descriptive details about the image content')
  } else if (altText.length > 125) {
    issues.push('Alt text is too long (maximum 125 characters recommended)')
    suggestions.push('Shorten to focus on essential information')
  }

  // Check for common issues
  if (altText.toLowerCase().includes('image of')) {
    issues.push('Avoid redundant phrases like "image of"')
    suggestions.push('Remove "image of" and describe the content directly')
  }

  if (altText.toLowerCase().includes('picture of')) {
    issues.push('Avoid redundant phrases like "picture of"')
    suggestions.push('Remove "picture of" and describe the content directly')
  }

  if (!altText.match(/[a-zA-Z]/)) {
    issues.push('Alt text must contain letters')
    suggestions.push('Add descriptive text using letters and words')
  }

  // Check for accessibility
  if (altText.endsWith('.')) {
    suggestions.push('Remove period at the end for better screen reader experience')
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  }
}

export function createImageMetadata(
  imageUrl?: string | null,
  options: AltTextOptions = {}
) {
  const altText = generateOptimizedAltText(imageUrl, options)
  const validation = validateAltText(altText)

  return {
    src: imageUrl || '',
    alt: altText,
    validation,
    isOptimized: validation.isValid
  }
}
