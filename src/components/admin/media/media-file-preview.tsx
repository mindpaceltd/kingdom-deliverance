'use client'

import * as React from 'react'
import { File, FileText, Music, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MediaAsset } from '@/lib/types'
import {
  getFileExtension,
  getMediaImageSources,
  getMediaPreviewUrl,
  getShortFilename,
  resolveMediaDisplayKind,
  type MediaDisplayKind,
} from '@/lib/media/media-preview'

function KindIcon({ kind, className }: { kind: MediaDisplayKind; className?: string }) {
  switch (kind) {
    case 'audio':
      return <Music className={className} />
    case 'video':
      return <Video className={className} />
    case 'pdf':
      return <FileText className={className} />
    default:
      return <File className={className} />
  }
}

interface MediaFilePreviewProps {
  asset: MediaAsset
  /** When false, only show a lightweight placeholder (grid tiles). */
  active?: boolean
  className?: string
  variant?: 'thumb' | 'detail'
}

export function MediaFilePreview({
  asset,
  active = true,
  className,
  variant = 'thumb',
}: MediaFilePreviewProps) {
  const kind = resolveMediaDisplayKind(asset)
  const previewUrl = getMediaPreviewUrl(asset)
  const imageSources = React.useMemo(() => getMediaImageSources(asset), [asset.url])
  const [sourceIndex, setSourceIndex] = React.useState(0)
  const [imageFailed, setImageFailed] = React.useState(false)

  React.useEffect(() => {
    setSourceIndex(0)
    setImageFailed(false)
  }, [asset.id, asset.url])

  const imageSrc = imageSources[sourceIndex] ?? previewUrl

  const showImage = kind === 'image' && active && !imageFailed && Boolean(imageSrc)
  const showPdf = kind === 'pdf' && active
  const showVideo = kind === 'video' && active

  const badge = (
    <span
      className={cn(
        'absolute bottom-1 left-1 z-10 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide',
        kind === 'pdf' ? 'bg-red-600 text-white' : 'bg-black/65 text-white'
      )}
    >
      {getFileExtension(asset)}
    </span>
  )

  const filenameStrip = variant === 'thumb' && kind !== 'image' && (
    <p className="absolute inset-x-0 bottom-0 z-10 truncate bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1 pt-4 text-[9px] font-medium text-white">
      {getShortFilename(asset, 22)}
    </p>
  )

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={asset.alt_text ?? asset.filename}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="h-full w-full object-cover"
          onError={() => {
            if (sourceIndex < imageSources.length - 1) {
              setSourceIndex((i) => i + 1)
              return
            }
            setImageFailed(true)
          }}
        />
      ) : showPdf ? (
        <div className="absolute inset-0 overflow-hidden bg-muted">
          <iframe
            src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            title={asset.filename}
            className="pointer-events-none absolute left-0 top-0 h-[280%] w-[280%] max-w-none origin-top-left scale-[0.36] border-0"
            tabIndex={-1}
          />
        </div>
      ) : showVideo ? (
        <video
          src={previewUrl}
          muted
          playsInline
          preload={active ? 'metadata' : 'none'}
          className="absolute inset-0 h-full w-full object-cover"
          onLoadedData={(e) => {
            const el = e.currentTarget
            if (el.duration > 0.5) el.currentTime = 0.5
          }}
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full flex-col items-center justify-center gap-1 p-2',
            kind === 'pdf' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted'
          )}
        >
          <KindIcon
            kind={imageFailed ? 'document' : kind}
            className={cn(
              variant === 'detail' ? 'size-16' : 'size-8',
              kind === 'pdf' ? 'text-red-600' : 'text-muted-foreground opacity-60'
            )}
          />
          {variant === 'detail' && (
            <p className="max-w-full truncate px-2 text-center text-xs text-muted-foreground">
              {asset.filename}
            </p>
          )}
        </div>
      )}

      {kind !== 'image' || imageFailed ? badge : null}
      {filenameStrip}
    </div>
  )
}
