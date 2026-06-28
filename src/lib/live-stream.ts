import {
  DEFAULT_YOUTUBE_CHANNEL_ID,
  DEFAULT_YOUTUBE_CHANNEL_URL,
  buildYouTubeChannelLiveUrl,
  buildYouTubeChannelUrl,
  buildYouTubeLiveEmbedUrl,
  parseYouTubeChannelId,
  parseYouTubeHandle,
  resolveYouTubeChannelIdFromHandle,
} from '@/lib/youtube-live'

export interface LiveStreamConfig {
  embedUrl: string
  channelUrl: string
  channelLiveUrl: string
  channelId: string
}

export async function getLiveStreamConfig(
  settings: Record<string, string> = {},
): Promise<LiveStreamConfig> {
  const youtubeUrl =
    settings.youtube_url?.trim() ||
    process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE?.trim() ||
    DEFAULT_YOUTUBE_CHANNEL_URL

  const overrideEmbed =
    settings.live_stream_url?.trim() || process.env.NEXT_PUBLIC_LIVE_STREAM_URL?.trim()

  let channelId =
    settings.youtube_channel_id?.trim() ||
    process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID?.trim() ||
    parseYouTubeChannelId(youtubeUrl) ||
    null

  if (!channelId) {
    const handle = parseYouTubeHandle(youtubeUrl)
    if (handle) {
      channelId = await resolveYouTubeChannelIdFromHandle(handle)
    }
  }

  if (!channelId) {
    channelId = DEFAULT_YOUTUBE_CHANNEL_ID
  }

  return {
    channelId,
    embedUrl: overrideEmbed || buildYouTubeLiveEmbedUrl(channelId),
    channelUrl: parseYouTubeChannelId(youtubeUrl)
      ? buildYouTubeChannelUrl(channelId)
      : youtubeUrl,
    channelLiveUrl: buildYouTubeChannelLiveUrl(channelId),
  }
}
