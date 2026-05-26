'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SeoPanel } from '@/components/admin/posts/seo-panel'
import { CmsSizedImageField } from '@/components/admin/pages/cms-sized-image-field'
import { OG_IMAGE_SPEC } from '@/lib/cms/page-image-specs'
import type { CmsPageSeo } from '@/lib/cms/page-content'
import { submitGoogleIndexing } from '@/lib/seo/submit-google-indexing-client'
import { Loader2, Radar } from 'lucide-react'
import { toast } from 'sonner'

export interface PageSeoPanelProps {
  seo: CmsPageSeo
  title: string
  slug: string
  bodyHtml: string
  heroImageUrl: string
  publicUrl: string
  isPublished: boolean
  onChange: (patch: Partial<CmsPageSeo>) => void
  disabled?: boolean
}

export function PageSeoPanel({
  seo,
  title,
  slug,
  bodyHtml,
  heroImageUrl,
  publicUrl,
  isPublished,
  onChange,
  disabled = false,
}: PageSeoPanelProps) {
  const [indexing, setIndexing] = React.useState(false)

  const ogImage = seo.ogImageUrl || heroImageUrl
  const featuredForScore = ogImage

  async function handleSubmitIndexing() {
    if (!isPublished) {
      toast.error('Publish the page first, then submit for indexing.')
      return
    }
    setIndexing(true)
    const canonical = seo.canonicalUrl?.trim() || publicUrl
    const result = await submitGoogleIndexing([canonical])
    setIndexing(false)
    if (!result.ok) {
      toast.error(result.message, { description: result.hint })
      return
    }
    toast.success(result.message)
  }

  return (
    <div className="space-y-4">
      <SeoPanel
        focusKeyword={seo.focusKeyword ?? ''}
        seoTitle={seo.metaTitle ?? title}
        metaDescription={seo.metaDescription ?? ''}
        content={bodyHtml}
        slug={slug}
        featuredImage={featuredForScore}
        publicUrl={publicUrl}
        onFocusKeywordChange={(v) => onChange({ focusKeyword: v })}
        onSeoTitleChange={(v) => onChange({ metaTitle: v })}
        onMetaDescriptionChange={(v) => onChange({ metaDescription: v })}
        disabled={disabled}
      />

      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Social &amp; Open Graph</h3>
        <div className="space-y-1.5">
          <Label htmlFor="page-og-title" className="text-xs font-medium">
            OG title
          </Label>
          <Input
            id="page-og-title"
            value={seo.ogTitle ?? ''}
            onChange={(e) => onChange({ ogTitle: e.target.value })}
            placeholder={seo.metaTitle || title || 'Defaults to SEO title'}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="page-og-description" className="text-xs font-medium">
            OG description
          </Label>
          <Textarea
            id="page-og-description"
            value={seo.ogDescription ?? ''}
            onChange={(e) => onChange({ ogDescription: e.target.value })}
            placeholder={seo.metaDescription || 'Defaults to meta description'}
            disabled={disabled}
            rows={2}
            className="text-sm resize-none"
          />
        </div>
        <CmsSizedImageField
          spec={OG_IMAGE_SPEC}
          value={seo.ogImageUrl ?? ''}
          onChange={(url) => onChange({ ogImageUrl: url })}
          disabled={disabled}
          pickerLabel="OG / share image"
        />
        {!seo.ogImageUrl && heroImageUrl && (
          <p className="text-xs text-muted-foreground">
            No OG image set — hero image will be used as fallback when the site reads CMS data.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Advanced SEO</h3>
        <div className="space-y-1.5">
          <Label htmlFor="page-canonical" className="text-xs font-medium">
            Canonical URL
          </Label>
          <Input
            id="page-canonical"
            value={seo.canonicalUrl ?? ''}
            onChange={(e) => onChange({ canonicalUrl: e.target.value })}
            placeholder={publicUrl}
            disabled={disabled}
            className="h-8 text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use <span className="font-mono">{publicUrl}</span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="page-noindex" className="text-xs font-medium">
              Hide from search engines
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sets noindex when CMS rendering is enabled
            </p>
          </div>
          <Switch
            id="page-noindex"
            checked={seo.noIndex === true}
            onCheckedChange={(c) => onChange({ noIndex: c })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Radar className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Google instant indexing</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Notify Google to crawl this URL after you publish. Requires Google connected in Settings
          → Analytics with the Indexing API scope.
        </p>
        <p className="text-xs font-mono text-muted-foreground break-all">{publicUrl}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={disabled || indexing || !isPublished || seo.noIndex}
          onClick={() => void handleSubmitIndexing()}
        >
          {indexing ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Submitting…
            </>
          ) : (
            'Submit URL to Google'
          )}
        </Button>
        {seo.noIndex && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Indexing disabled while &quot;Hide from search engines&quot; is on.
          </p>
        )}
        {!isPublished && (
          <p className="text-xs text-muted-foreground">Publish the page to enable indexing.</p>
        )}
      </div>
    </div>
  )
}

/** Called after a successful save when page is published and not noindex. */
export async function indexCmsPageUrl(publicUrl: string, canonicalUrl?: string): Promise<void> {
  const url = canonicalUrl?.trim() || publicUrl
  const result = await submitGoogleIndexing([url])
  if (!result.ok) {
    toast.warning(result.message, { description: result.hint })
    return
  }
  toast.success(result.message)
}
