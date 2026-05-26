/** OAuth scopes requested when connecting Google (Analytics + Search Console + Indexing). */
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/siteverification',
  'https://www.googleapis.com/auth/siteverification.verify_only',
  'https://www.googleapis.com/auth/indexing',
  'openid',
  'profile',
  'email',
] as const

export const GOOGLE_INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing'

export function hasGoogleIndexingScope(scope: string | null | undefined): boolean {
  if (!scope) return false
  return scope.split(/\s+/).some((s) => s.includes('indexing'))
}
