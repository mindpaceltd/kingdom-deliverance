import { describe, expect, it } from 'vitest'
import { resolveMediaDisplayKind } from '../media-preview'
import type { MediaAsset } from '@/lib/types'

function asset(partial: Partial<MediaAsset> & Pick<MediaAsset, 'type'>): MediaAsset {
  return {
    id: '1',
    filename: 'file.bin',
    url: 'https://example.com/file.bin',
    mime_type: null,
    size_bytes: 100,
    alt_text: null,
    caption: null,
    uploaded_by: null,
    bucket: 'media',
    created_at: new Date().toISOString(),
    ...partial,
  }
}

describe('resolveMediaDisplayKind', () => {
  it('detects images from mime even when type is document', () => {
    expect(
      resolveMediaDisplayKind(
        asset({
          type: 'document',
          mime_type: 'image/jpeg',
          filename: 'photo.jpg',
        })
      )
    ).toBe('image')
  })

  it('detects pdf from extension', () => {
    expect(
      resolveMediaDisplayKind(
        asset({
          type: 'document',
          filename: 'sermon-notes.pdf',
          url: 'https://pub.r2.dev/uploads/sermon-notes.pdf',
        })
      )
    ).toBe('pdf')
  })

  it('detects video type', () => {
    expect(
      resolveMediaDisplayKind(
        asset({ type: 'video', mime_type: 'video/mp4', filename: 'clip.mp4' })
      )
    ).toBe('video')
  })
})
