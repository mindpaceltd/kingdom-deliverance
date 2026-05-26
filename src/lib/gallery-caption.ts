/** Turn a storage filename into a readable default title. */
export function titleFromImageUrl(url: string): string | null {
  try {
    const path = url.split('?')[0]
    const raw = path.split('/').pop() || ''
    const withoutExt = raw.replace(/\.[a-z0-9]+$/i, '')
    const withoutTimestamp = withoutExt.replace(/^\d+-/, '')
    const readable = withoutTimestamp
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!readable || readable.length < 3) return null
    if (/^[a-f0-9]{16,}$/i.test(readable.replace(/\s/g, ''))) return null

    return readable.charAt(0).toUpperCase() + readable.slice(1)
  } catch {
    return null
  }
}

export function titleFromFilename(filename: string): string | null {
  return titleFromImageUrl(`https://x/${filename}`)
}

export function resolveGalleryCaption(input: {
  description?: string | null
  title?: string | null
  image_url: string
  album?: string | null
}): string {
  const desc = input.description?.trim()
  if (desc) return desc

  const title = input.title?.trim()
  if (title) return title

  const fromUrl = titleFromImageUrl(input.image_url)
  if (fromUrl) return fromUrl

  const album = input.album?.trim()
  if (album) {
    return album.charAt(0).toUpperCase() + album.slice(1)
  }

  return 'Gallery photo'
}
