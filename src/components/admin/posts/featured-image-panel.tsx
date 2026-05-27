'use client'

import { Button } from '@/components/ui/button'
import { MediaPicker } from '@/components/admin/media-picker'
import { MediaUrlPreview } from '@/components/admin/media/media-url-preview'
import { XIcon, ImageIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeaturedImagePanelProps {
  value: string  // URL or ''
  onChange: (url: string) => void
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// FeaturedImagePanel
// ---------------------------------------------------------------------------

export function FeaturedImagePanel({
  value,
  onChange,
  disabled = false,
}: FeaturedImagePanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Featured Image</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Recommended: <span className="font-medium text-foreground">1200 × 630 px</span> (1.91:1) — used for social sharing previews on WhatsApp, Facebook, Twitter.
        </p>
      </div>

      {/* Thumbnail preview */}
      {value ? (
        <div className="space-y-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
            <MediaUrlPreview
              url={value}
              alt="Featured image preview"
              className="absolute inset-0"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onChange('')}
            className="w-full text-destructive hover:text-destructive"
          >
            <XIcon className="size-3.5" />
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 py-6 text-muted-foreground">
          <ImageIcon className="size-8 opacity-40" />
          <p className="text-xs">No image selected</p>
        </div>
      )}

      {/* Media picker */}
      <MediaPicker
        value={value || undefined}
        onSelect={onChange}
        label={value ? 'Change Image' : 'Select Image'}
        accept="image"
      />
    </div>
  )
}
