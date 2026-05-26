import { cn } from '@/lib/utils'

interface GalleryCaptionOverlayProps {
  caption: string
  className?: string
}

/** Caption on the bottom of a gallery thumbnail (max 2 lines + ellipsis). */
export function GalleryCaptionOverlay({ caption, className }: GalleryCaptionOverlayProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-10 p-1',
        className
      )}
    >
      <p
        className="line-clamp-2 max-w-full rounded-sm bg-black/70 text-left text-[10px] font-semibold leading-snug text-white sm:text-[11px]"
        style={{ padding: '2px' }}
        title={caption}
      >
        {caption}
      </p>
    </div>
  )
}
