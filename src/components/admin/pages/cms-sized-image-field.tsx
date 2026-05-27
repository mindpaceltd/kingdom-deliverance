'use client'

import { MediaPicker } from '@/components/admin/media-picker'
import { MediaUrlPreview } from '@/components/admin/media/media-url-preview'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  formatImageDimensions,
  type PageImageSpec,
} from '@/lib/cms/page-image-specs'
import { ImageIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CmsSizedImageFieldProps {
  spec: PageImageSpec
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  pickerLabel?: string
}

export function CmsSizedImageField({
  spec,
  value,
  onChange,
  disabled = false,
  pickerLabel,
}: CmsSizedImageFieldProps) {
  const hasFixedHeight = spec.height > 0
  const aspectStyle = hasFixedHeight
    ? { aspectRatio: `${spec.width} / ${spec.height}` }
    : { aspectRatio: '16 / 9' as const }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Label className="text-sm font-medium">{spec.label}</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Exact size:{' '}
            <span className="font-mono font-semibold text-foreground">
              {formatImageDimensions(spec)}
            </span>
            {spec.aspectRatio !== 'flexible' && (
              <span className="ml-1 text-muted-foreground">({spec.aspectRatio})</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{spec.hint}</p>
        </div>
      </div>

      {value ? (
        <div className="space-y-2">
          <div
            className={cn(
              'relative w-full max-w-md overflow-hidden rounded-md border border-border bg-muted',
              !hasFixedHeight && 'max-h-48'
            )}
            style={aspectStyle}
          >
            <MediaUrlPreview url={value} alt={spec.label} className="absolute inset-0" />
          </div>
          <div className="flex flex-wrap gap-2">
            <MediaPicker
              value={value}
              onSelect={onChange}
              accept="image"
              label={pickerLabel ?? 'Replace image'}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onChange('')}
              className="text-destructive hover:text-destructive"
            >
              <XIcon className="mr-1 size-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border bg-background py-8">
          <ImageIcon className="size-10 text-muted-foreground/40" />
          <p className="text-center text-xs text-muted-foreground px-4">
            No image yet — upload at {formatImageDimensions(spec)} for best results.
          </p>
          <MediaPicker
            value={undefined}
            onSelect={onChange}
            accept="image"
            label={pickerLabel ?? 'Select image'}
          />
        </div>
      )}
    </div>
  )
}
