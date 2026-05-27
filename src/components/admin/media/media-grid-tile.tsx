'use client'

import { MediaFilePreview } from '@/components/admin/media/media-file-preview'
import { getShortFilename } from '@/lib/media/media-preview'
import type { MediaAsset } from '@/lib/types'
import { cn } from '@/lib/utils'

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface MediaGridTileProps {
  asset: MediaAsset
  onSelect: () => void
  className?: string
  /** Overlay filename on the thumb (larger image in modals). */
  metaOverlay?: boolean
}

/** Grid cell used in Media Library picker dialogs and similar selectors. */
export function MediaGridTile({
  asset,
  onSelect,
  className,
  metaOverlay = false,
}: MediaGridTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group w-full overflow-hidden rounded-lg border border-border bg-card text-left transition-colors',
        'hover:border-primary hover:ring-2 hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      title={asset.alt_text ?? asset.filename}
    >
      <div className="relative w-full overflow-hidden bg-muted">
        <div className="relative w-full pb-[100%]">
          <div className="absolute inset-0">
            <MediaFilePreview asset={asset} active variant="thumb" />
          </div>
          {metaOverlay && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2 pb-2 pt-8">
              <p className="truncate text-xs font-medium text-white">
                {getShortFilename(asset, 36)}
              </p>
              {asset.size_bytes != null && asset.size_bytes > 0 && (
                <p className="text-[10px] text-white/75">{formatBytes(asset.size_bytes)}</p>
              )}
            </div>
          )}
        </div>
      </div>
      {!metaOverlay && (
        <div className="border-t border-border/60 bg-background px-2 py-1.5">
          <p className="truncate text-xs font-medium leading-tight text-foreground">
            {getShortFilename(asset, 32)}
          </p>
          {asset.size_bytes != null && asset.size_bytes > 0 && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {formatBytes(asset.size_bytes)}
            </p>
          )}
        </div>
      )}
    </button>
  )
}
