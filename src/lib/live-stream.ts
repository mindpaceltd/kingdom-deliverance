import {
  DEFAULT_YOUTUBE_CHANNEL_ID,
  DEFAULT_YOUTUBE_CHANNEL_URL,
  buildYouTubeChannelLiveUrl,
  buildYouTubeChannelUrl,
  buildYouTubeLiveEmbedUrl,
  buildYouTubeVideoEmbedUrl,
  fetchActiveLiveVideoId,
  fetchLatestChannelVideoId,
  parseYouTubeChannelId,
  parseYouTubeHandle,
  resolveYouTubeChannelIdFromHandle,
  sanitizeYouTubeChannelId,
  validateYouTubeChannelId,
} from '@/lib/youtube-live'

export interface LiveStreamConfig {
  embedUrl: string
  channelUrl: string
  channelLiveUrl: string
  channelId: string
  isLive: boolean
  mode: 'live' | 'recent' | 'channel'
  recentVideoId: string | null
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
    sanitizeYouTubeChannelId(settings.youtube_channel_id) ||
    sanitizeYouTubeChannelId(process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID) ||
    parseYouTubeChannelId(youtubeUrl) ||
    null

  if (channelId && !(await validateYouTubeChannelId(channelId))) {
    channelId = null
  }

  if (!channelId) {
    const handle = parseYouTubeHandle(youtubeUrl)
    if (handle) {
      channelId = await resolveYouTubeChannelIdFromHandle(handle)
    }
  }

  if (!channelId) {
    channelId = DEFAULT_YOUTUBE_CHANNEL_ID
  }

  const channelUrl = parseYouTubeChannelId(youtubeUrl)
    ? buildYouTubeChannelUrl(channelId)
    : youtubeUrl
  const channelLiveUrl = buildYouTubeChannelLiveUrl(channelId)

  if (overrideEmbed) {
    return {
      channelId,
      embedUrl: overrideEmbed,
      channelUrl,
      channelLiveUrl,
      isLive: overrideEmbed.includes('live_stream'),
      mode: 'channel',
      recentVideoId: null,
    }
  }

  const [liveVideoId, recentVideoId] = await Promise.all([
    fetchActiveLiveVideoId(channelId),
    fetchLatestChannelVideoId(channelId),
  ])

  if (liveVideoId) {
    return {
      channelId,
      embedUrl: buildYouTubeVideoEmbedUrl(liveVideoId),
      channelUrl,
      channelLiveUrl,
      isLive: true,
      mode: 'live',
      recentVideoId: liveVideoId,
    }
  }

  if (recentVideoId) {
    return {
      channelId,
      embedUrl: buildYouTubeVideoEmbedUrl(recentVideoId),
      channelUrl,
      channelLiveUrl,
      isLive: false,
      mode: 'recent',
      recentVideoId,
    }
  }

  return {
    channelId,
    embedUrl: buildYouTubeLiveEmbedUrl(channelId),
    channelUrl,
    channelLiveUrl,
    isLive: false,
    mode: 'channel',
    recentVideoId: null,
  }
}
