/** Meta (Facebook / Instagram) Graph API OAuth helpers */

export const META_OAUTH_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'pages_manage_metadata',
  'pages_read_user_content',
  'instagram_basic',
  'instagram_manage_insights',
  'instagram_content_publish',
  'business_management',
] as const

export function encodeMetaOAuthState(userId: string, returnTo?: string | null): string {
  const payload = {
    u: userId,
    r: sanitizeReturn(returnTo),
    t: Date.now(),
  }
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

export function parseMetaOAuthState(state: string): {
  userId: string
  returnTo: string | null
} | null {
  try {
    const json = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
      u?: string
      r?: string | null
      t?: number
    }
    if (!json.u || typeof json.u !== 'string') return null
    // 1 hour max age
    if (json.t && Date.now() - json.t > 60 * 60 * 1000) return null
    return { userId: json.u, returnTo: sanitizeReturn(json.r) }
  } catch {
    return null
  }
}

function sanitizeReturn(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/admin')) return null
  if (path.includes('://') || path.includes('//') || path.includes('\\')) return null
  return path
}

export function metaConfigured(): boolean {
  return Boolean(process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim())
}

export function getMetaAppCredentials() {
  const appId = process.env.META_APP_ID?.trim()
  const appSecret = process.env.META_APP_SECRET?.trim()
  if (!appId || !appSecret) {
    throw new Error('META_APP_ID and META_APP_SECRET are required')
  }
  return { appId, appSecret }
}

export const META_GRAPH_VERSION = 'v21.0'
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`
