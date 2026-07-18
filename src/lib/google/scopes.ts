import { google } from 'googleapis'

/** OAuth scopes for Analytics, Search Console, Indexing, and YouTube (Digital Ministry). */
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/siteverification',
  'https://www.googleapis.com/auth/siteverification.verify_only',
  'https://www.googleapis.com/auth/indexing',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'openid',
  'profile',
  'email',
] as const

export const GOOGLE_INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing'

export const GOOGLE_YOUTUBE_READONLY_SCOPE =
  'https://www.googleapis.com/auth/youtube.readonly'

export function hasGoogleIndexingScope(scope: string | null | undefined): boolean {
  if (!scope) return false
  return scope.split(/\s+/).some((s) => s.includes('indexing'))
}

export function hasYouTubeScope(scope: string | null | undefined): boolean {
  if (!scope) return false
  return scope.split(/\s+/).some((s) => s.includes('youtube') || s.includes('yt-analytics'))
}

/** Encode user id + optional safe return path for OAuth state. */
export function encodeGoogleOAuthState(userId: string, returnTo?: string | null): string {
  if (!returnTo) return userId
  const safe = sanitizeAdminReturnTo(returnTo)
  if (!safe) return userId
  return `${userId}::${encodeURIComponent(safe)}`
}

export function parseGoogleOAuthState(state: string): {
  userId: string
  returnTo: string | null
} {
  const sep = state.indexOf('::')
  if (sep === -1) return { userId: state, returnTo: null }
  const userId = state.slice(0, sep)
  const raw = decodeURIComponent(state.slice(sep + 2))
  return { userId, returnTo: sanitizeAdminReturnTo(raw) }
}

export function sanitizeAdminReturnTo(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/admin')) return null
  if (path.includes('://') || path.includes('//') || path.includes('\\')) return null
  return path
}

export function createGoogleOAuthClient(redirectUri: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  )
}
