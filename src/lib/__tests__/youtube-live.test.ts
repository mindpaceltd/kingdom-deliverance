import { describe, expect, it } from 'vitest'
import {
  buildYouTubeLiveEmbedUrl,
  parseYouTubeChannelId,
  parseYouTubeHandle,
  sanitizeYouTubeChannelId,
} from '@/lib/youtube-live'

describe('youtube-live', () => {
  it('parses channel IDs from common YouTube URL formats', () => {
    expect(parseYouTubeChannelId('UChhdehWEPhFS7ebO8WDEjEA')).toBe('UChhdehWEPhFS7ebO8WDEjEA')
    expect(parseYouTubeChannelId('https://www.youtube.com/channel/UChhdehWEPhFS7ebO8WDEjEA')).toBe(
      'UChhdehWEPhFS7ebO8WDEjEA',
    )
    expect(
      parseYouTubeChannelId(
        'https://www.youtube.com/embed/live_stream?channel=UChhdehWEPhFS7ebO8WDEjEA',
      ),
    ).toBe('UChhdehWEPhFS7ebO8WDEjEA')
  })

  it('parses @handles from channel URLs', () => {
    expect(parseYouTubeHandle('https://www.youtube.com/@bishopclimateministries')).toBe(
      'bishopclimateministries',
    )
    expect(parseYouTubeHandle('@bishopclimateministries')).toBe('bishopclimateministries')
  })

  it('builds the YouTube live embed URL', () => {
    expect(buildYouTubeLiveEmbedUrl('UChhdehWEPhFS7ebO8WDEjEA')).toContain(
      'youtube.com/embed/live_stream',
    )
    expect(buildYouTubeLiveEmbedUrl('UChhdehWEPhFS7ebO8WDEjEA')).toContain(
      'channel=UChhdehWEPhFS7ebO8WDEjEA',
    )
  })

  it('sanitizes channel IDs with unicode dashes', () => {
    expect(sanitizeYouTubeChannelId('UCA2h24sSX‑i0ZxM09‑‑qnQg')).toBe('UCA2h24sSX-i0ZxM09--qnQg')
    expect(sanitizeYouTubeChannelId('UChhdehWEPhFS7ebO8WDEjEA')).toBe(
      'UChhdehWEPhFS7ebO8WDEjEA',
    )
  })
})
