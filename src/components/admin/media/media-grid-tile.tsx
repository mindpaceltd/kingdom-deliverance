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
}

/** Grid cell used in Media Library picker dialogs and similar selectors. */
export function MediaGridTile({ asset, onSelect, className }: MediaGridTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border border-border bg-muted/30 text-left transition-colors',
        'hover:border-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      title={asset.alt_text ?? asset.filename}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <MediaFilePreview asset={asset} active variant="thumb" />
      </div>
      <div className="border-t border-border/60 bg-background/80 px-2 py-1.5">
        <p className="truncate text-xs font-medium leading-tight text-foreground">
          {getShortFilename(asset, 32)}
        </p>
        {asset.size_bytes != null && asset.size_bytes > 0 && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {formatBytes(asset.size_bytes)}
          </p>
        )}
      </div>
    </button>
  )
}
