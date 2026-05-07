/**
 * Canonical URL Utilities - Ensures proper canonical tags
 */

export function generateCanonicalUrl(
  path: string,
  baseUrl: string = 'https://kdcuganda.org'
): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  // Remove trailing slash except for homepage
  const finalPath = cleanPath === '/' ? cleanPath : cleanPath.replace(/\/$/, '')
  
  return `${baseUrl}${finalPath}`
}

export function createCanonicalMetadata(path: string) {
  const canonicalUrl = generateCanonicalUrl(path)
  
  return {
    alternates: {
      canonical: canonicalUrl
    }
  }
}
