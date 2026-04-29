/**
 * AudioPlayer — renders an HTML5 <audio controls> element.
 * Requirements: 14.5
 */

interface AudioPlayerProps {
  url: string
  title?: string
  className?: string
}

export function AudioPlayer({ url, title, className }: AudioPlayerProps) {
  return (
    <div className={className}>
      {title && (
        <p className="mb-2 text-sm font-medium text-foreground">{title}</p>
      )}
      <audio
        src={url}
        controls
        className="w-full"
        aria-label={title ?? 'Audio player'}
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}
