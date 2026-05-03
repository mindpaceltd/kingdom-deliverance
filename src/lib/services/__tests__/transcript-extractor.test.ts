import { describe, it, expect } from 'vitest'
import { extractYouTubeVideoId, normalizeYouTubeUrl } from '../transcript-extractor'

describe('normalizeYouTubeUrl', () => {
  it('should convert Shorts URL to standard watch URL', () => {
    const shortsUrl = 'https://www.youtube.com/shorts/NCMNt1HscZk'
    const normalized = normalizeYouTubeUrl(shortsUrl)
    expect(normalized).toBe('https://www.youtube.com/watch?v=NCMNt1HscZk')
  })

  it('should convert Shorts URL without protocol to standard watch URL', () => {
    const shortsUrl = 'youtube.com/shorts/NCMNt1HscZk'
    const normalized = normalizeYouTubeUrl(shortsUrl)
    expect(normalized).toBe('https://www.youtube.com/watch?v=NCMNt1HscZk')
  })

  it('should leave standard watch URL unchanged', () => {
    const watchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    const normalized = normalizeYouTubeUrl(watchUrl)
    expect(normalized).toBe(watchUrl)
  })

  it('should leave youtu.be URL unchanged', () => {
    const shortUrl = 'https://youtu.be/dQw4w9WgXcQ'
    const normalized = normalizeYouTubeUrl(shortUrl)
    expect(normalized).toBe(shortUrl)
  })

  it('should leave embed URL unchanged', () => {
    const embedUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    const normalized = normalizeYouTubeUrl(embedUrl)
    expect(normalized).toBe(embedUrl)
  })
})

describe('extractYouTubeVideoId', () => {
  it('should extract video ID from youtube.com/watch?v= URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBe('dQw4w9WgXcQ')
  })

  it('should extract video ID from youtu.be/ URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ'
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBe('dQw4w9WgXcQ')
  })

  it('should extract video ID from youtube.com/embed/ URL', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBe('dQw4w9WgXcQ')
  })

  it('should extract video ID from youtube.com/shorts/ URL', () => {
    const url = 'https://www.youtube.com/shorts/NCMNt1HscZk'
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBe('NCMNt1HscZk')
  })

  it('should extract video ID from youtube.com/shorts/ URL without protocol', () => {
    const url = 'youtube.com/shorts/NCMNt1HscZk'
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBe('NCMNt1HscZk')
  })

  it('should extract video ID from URL with query parameters', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s'
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBe('dQw4w9WgXcQ')
  })

  it('should return null for non-YouTube URL', () => {
    const url = 'https://vimeo.com/123456789'
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBeNull()
  })

  it('should return null for invalid URL', () => {
    const url = 'not a url'
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBeNull()
  })

  it('should return null for empty string', () => {
    const url = ''
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBeNull()
  })

  it('should handle URL without protocol', () => {
    const url = 'youtube.com/watch?v=dQw4w9WgXcQ'
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBe('dQw4w9WgXcQ')
  })

  it('should handle youtu.be URL without protocol', () => {
    const url = 'youtu.be/dQw4w9WgXcQ'
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBe('dQw4w9WgXcQ')
  })

  it('should handle video ID with hyphens and underscores', () => {
    const url = 'https://www.youtube.com/watch?v=abc-DEF_123'
    const videoId = extractYouTubeVideoId(url)
    expect(videoId).toBe('abc-DEF_123')
  })
})
