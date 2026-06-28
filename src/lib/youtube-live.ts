const CHANNEL_ID_PATTERN = /UC[\w-]{22}/

export function parseYouTubeChannelId(value?: string | null): string | null {
  const input = value?.trim()
  if (!input) return null

  const direct = input.match(CHANNEL_ID_PATTERN)
  if (direct) return direct[0]

  const fromChannelPath = input.match(/youtube\.com\/channel\/(UC[\w-]{22})/i)
  if (fromChannelPath) return fromChannelPath[1]

  const fromEmbed = input.match(/[?&]channel=(UC[\w-]{22})/i)
  if (fromEmbed) return fromEmbed[1]

  return null
}

export function parseYouTubeHandle(value?: string | null): string | null {
  const input = value?.trim()
  if (!input) return null

  const match = input.match(/youtube\.com\/@([^/?#]+)/i) || input.match(/^@([^/?#]+)/)
  return match?.[1] ?? null
}

export async function resolveYouTubeChannelIdFromHandle(handle: string): Promise<string | null> {
  const normalized = handle.replace(/^@/, '').trim()
  if (!normalized) return null

  try {
    const response = await fetch(`https://www.youtube.com/@${normalized}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; KDCUgandaBot/1.0; +https://kdcuganda.org/live)',
      },
      next: { revalidate: 60 * 60 * 24 },
    })

    if (!response.ok) return null

    const html = await response.text()
    const externalId = html.match(/"externalId":"(UC[\w-]{22})"/)?.[1]
    if (externalId) return externalId

    const channelId = html.match(/"channelId":"(UC[\w-]{22})"/)?.[1]
    return channelId ?? null
  } catch {
    return null
  }
}

export function buildYouTubeLiveEmbedUrl(channelId: string): string {
  const params = new URLSearchParams({
    channel: channelId,
    autoplay: '0',
    rel: '0',
    modestbranding: '1',
  })
  return `https://www.youtube.com/embed/live_stream?${params.toString()}`
}

export function buildYouTubeChannelLiveUrl(channelId: string): string {
  return `https://www.youtube.com/channel/${channelId}/live`
}

export function buildYouTubeChannelUrl(channelId: string): string {
  return `https://www.youtube.com/channel/${channelId}`
}

export const DEFAULT_YOUTUBE_CHANNEL_ID = 'UChhdehWEPhFS7ebO8WDEjEA'
export const DEFAULT_YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@bishopclimateministries'
