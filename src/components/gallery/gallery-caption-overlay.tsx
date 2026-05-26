import { cn } from '@/lib/utils'

interface GalleryCaptionOverlayProps {
  caption: string
  className?: string
}

/** Caption band on the bottom of a gallery thumbnail (max 2 lines + ellipsis). */
export function GalleryCaptionOverlay({ caption, className }: GalleryCaptionOverlayProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-10',
        'bg-gradient-to-t from-black/90 via-black/50 to-transparent',
        'px-2 pb-2 pt-8 backdrop-blur-sm',
        className
      )}
    >
      <p
        className="line-clamp-2 text-left text-[10px] font-semibold leading-snug text-white drop-shadow-sm sm:text-[11px]"
        title={caption}
      >
        {caption}
      </p>
    </div>
  )
}
