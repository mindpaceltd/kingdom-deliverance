import {
  DEFAULT_YOUTUBE_CHANNEL_ID,
  DEFAULT_YOUTUBE_CHANNEL_URL,
  buildYouTubeChannelLiveUrl,
  buildYouTubeChannelUrl,
  buildYouTubeLiveEmbedUrl,
  buildYouTubeVideoEmbedUrl,
  buildYouTubeWatchUrl,
  DEFAULT_KDC_LIVE_VIDEO_ID,
  DEFAULT_KDC_LIVE_WATCH_URL,
  fetchActiveLiveVideoId,
  fetchLatestChannelVideoId,
  fetchVideoIsLiveNow,
  isEmbeddableChannelVideo,
  parseYouTubeChannelId,
  parseYouTubeHandle,
  parseYouTubeVideoId,
  resolveYouTubeChannelIdFromHandle,
  sanitizeYouTubeChannelId,
  validateYouTubeChannelId,
} from '@/lib/youtube-live'

export interface LiveStreamConfig {
  embedUrl: string
  channelUrl: string
  channelLiveUrl: string
  /** Direct link to the current stream or video on YouTube. */
  streamPageUrl: string
  channelId: string
  isLive: boolean
  mode: 'live' | 'recent' | 'channel'
  recentVideoId: string | null
}

function configFromVideoId(
  videoId: string,
  isLive: boolean,
  base: Pick<LiveStreamConfig, 'channelId' | 'channelUrl' | 'channelLiveUrl'>,
): LiveStreamConfig {
  const watchUrl = buildYouTubeWatchUrl(videoId)
  return {
    ...base,
    embedUrl: buildYouTubeVideoEmbedUrl(videoId),
    streamPageUrl: watchUrl,
    isLive,
    mode: isLive ? 'live' : 'recent',
    recentVideoId: videoId,
  }
}

export async function getLiveStreamConfig(
  settings: Record<string, string> = {},
): Promise<LiveStreamConfig> {
  const youtubeUrl =
    settings.youtube_url?.trim() ||
    process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE?.trim() ||
    DEFAULT_YOUTUBE_CHANNEL_URL

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
  const base = { channelId, channelUrl, channelLiveUrl }

  const overrideRaw =
    settings.live_stream_url?.trim() ||
    process.env.NEXT_PUBLIC_LIVE_STREAM_URL?.trim() ||
    DEFAULT_KDC_LIVE_WATCH_URL

  const overrideVideoId = parseYouTubeVideoId(overrideRaw)
  if (overrideVideoId) {
    const isLive = await fetchVideoIsLiveNow(overrideVideoId)
    return configFromVideoId(overrideVideoId, isLive, base)
  }

  if (overrideRaw.startsWith('http') && overrideRaw.includes('embed/')) {
    const isLive = overrideRaw.includes('live_stream')
    return {
      ...base,
      embedUrl: overrideRaw,
      streamPageUrl: channelLiveUrl,
      isLive,
      mode: 'channel',
      recentVideoId: null,
    }
  }

  const [liveVideoId, recentVideoId] = await Promise.all([
    fetchActiveLiveVideoId(channelId),
    fetchLatestChannelVideoId(channelId),
  ])

  if (liveVideoId && (await isEmbeddableChannelVideo(liveVideoId))) {
    return configFromVideoId(liveVideoId, true, base)
  }

  if (recentVideoId) {
    return configFromVideoId(recentVideoId, false, base)
  }

  if (await isEmbeddableChannelVideo(DEFAULT_KDC_LIVE_VIDEO_ID)) {
    const isLive = await fetchVideoIsLiveNow(DEFAULT_KDC_LIVE_VIDEO_ID)
    return configFromVideoId(DEFAULT_KDC_LIVE_VIDEO_ID, isLive, base)
  }

  return {
    ...base,
    embedUrl: buildYouTubeLiveEmbedUrl(channelId),
    streamPageUrl: channelLiveUrl,
    isLive: false,
    mode: 'channel',
    recentVideoId: null,
  }
}
