/**
 * VideoPlayer — renders an embedded iframe for YouTube/Vimeo URLs,
 * or an HTML5 <video> element for direct video file URLs.
 * Requirements: 14.3, 14.4
 */

interface VideoPlayerProps {
  url: string
  title?: string
  className?: string
}

function getEmbedUrl(url: string): string | null {
  // YouTube: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
  const ytMatch =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/)
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`
  }

  // Vimeo: https://vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  return null
}

export function VideoPlayer({ url, title = 'Video', className }: VideoPlayerProps) {
  const embedUrl = getEmbedUrl(url)

  if (embedUrl) {
    return (
      <div className={className}>
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // Direct video file (.mp4, .webm, .ogg)
  return (
    <div className={className}>
      <video
        src={url}
        controls
        className="w-full h-full"
        title={title}
      >
        Your browser does not support the video element.
      </video>
    </div>
  )
}
