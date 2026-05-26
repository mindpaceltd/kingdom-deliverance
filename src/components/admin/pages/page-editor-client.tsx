'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SlugInput } from '@/components/admin/slug-input'
import { SeoPanel } from '@/components/admin/posts/seo-panel'
import { MediaPicker } from '@/components/admin/media-picker'
import { createPage, updatePageFromEditor } from '@/lib/actions/pages'
import {
  buildContentJson,
  pagePathFromSlug,
  pageTypeLabel,
  parsePageContent,
  type CmsPageContent,
} from '@/lib/cms/page-content'
import type { CmsPage } from '@/lib/types'
import { toast } from 'sonner'

const RichTextEditor = dynamic(
  () =>
    import('@/components/admin/rich-text-editor').then((m) => ({
      default: m.RichTextEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

function emptyContent(): CmsPageContent {
  return { pageType: 'custom', bodyHtml: '', isSystem: false }
}

export function PageEditorClient({ page }: { page?: CmsPage }) {
  const router = useRouter()
  const isEdit = Boolean(page)
  const initial = page ? parsePageContent(page.content_json) : emptyContent()

  const [title, setTitle] = React.useState(page?.title ?? '')
  const [slug, setSlug] = React.useState(page?.slug === '' ? 'home' : page?.slug ?? '')
  const [status, setStatus] = React.useState<'draft' | 'published'>(
    page?.status ?? 'draft'
  )
  const [content, setContent] = React.useState<CmsPageContent>(initial)
  const [saving, setSaving] = React.useState(false)

  const isSystem = content.isSystem === true
  const publicPath = pagePathFromSlug(slug === 'home' ? '' : slug)

  function patchContent(patch: Partial<CmsPageContent>) {
    setContent((prev) => ({ ...prev, ...patch }))
  }

  function patchHero(patch: Partial<NonNullable<CmsPageContent['hero']>>) {
    setContent((prev) => ({
      ...prev,
      hero: { title: prev.hero?.title ?? title, ...prev.hero, ...patch },
    }))
  }

  function patchSeo(patch: Partial<NonNullable<CmsPageContent['seo']>>) {
    setContent((prev) => ({
      ...prev,
      seo: { ...prev.seo, ...patch },
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!content.hero?.title?.trim() && !['privacy', 'terms'].includes(content.pageType)) {
      patchHero({ title: title.trim() })
    }

    setSaving(true)
    const payload = {
      title: title.trim(),
      slug,
      status,
      content: {
        ...content,
        hero: { title: title.trim(), ...content.hero },
      },
    }

    const result = isEdit
      ? await updatePageFromEditor(page!.id, payload)
      : await createPage({
          title: payload.title,
          slug: payload.slug,
          status: payload.status,
          content_json: buildContentJson({
            ...payload.content,
            pageType: 'custom',
            isSystem: false,
          }),
        })

    setSaving(false)

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? 'Page saved' : 'Page created')
    if (!isEdit && 'id' in result) {
      router.push(`/admin/pages/${result.id}`)
    } else {
      router.refresh()
    }
  }

  const seo = content.seo ?? {}
  const hero = content.hero ?? { title: title }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/pages">
            <ArrowLeft className="mr-2 size-4" />
            All pages
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {pageTypeLabel(content.pageType, content.listingTarget)}
          </span>
          {isSystem && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              System page
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <Info className="mr-2 inline size-4" />
        Content is saved in the CMS only. The public site still uses the existing Next.js pages
        until front-end rendering is connected. Planned URL:{' '}
        <code className="font-mono text-xs">{publicPath}</code>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="space-y-1.5">
              <Label htmlFor="page-title">Page title</Label>
              <Input
                id="page-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            {!isSystem ? (
              <SlugInput
                title={title}
                value={slug}
                onChange={setSlug}
                disabled={saving}
              />
            ) : (
              <div className="space-y-1">
                <Label>URL path</Label>
                <p className="font-mono text-sm text-muted-foreground">{publicPath}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Page excerpt</Label>
              <Textarea
                value={content.excerpt ?? ''}
                onChange={(e) => patchContent({ excerpt: e.target.value })}
                rows={2}
                placeholder="Short summary for admin reference or future listings"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Hero section</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Hero badge (optional)</Label>
                <Input
                  value={hero.badge ?? ''}
                  onChange={(e) => patchHero({ badge: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Hero headline</Label>
                <Input
                  value={hero.title ?? ''}
                  onChange={(e) => patchHero({ title: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Hero subtitle</Label>
                <Textarea
                  value={hero.subtitle ?? ''}
                  onChange={(e) => patchHero({ subtitle: e.target.value })}
                  rows={2}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Hero background image</Label>
                <MediaPicker
                  value={hero.imageUrl ?? ''}
                  onSelect={(url) => patchHero({ imageUrl: url })}
                  accept="image"
                  label="Hero image"
                />
              </div>
            </div>
          </div>

          {(content.pageType === 'about' || content.pageType === 'custom') && (
            <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Mission block (About)</h2>
              <Input
                value={content.missionTitle ?? ''}
                onChange={(e) => patchContent({ missionTitle: e.target.value })}
                placeholder="Mission heading"
                disabled={saving}
              />
              <RichTextEditor
                value={content.missionHtml ?? ''}
                onChange={(html) => patchContent({ missionHtml: html })}
                placeholder="Mission statement…"
                disabled={saving}
                compact
                editorMinHeight="min-h-[160px]"
              />
            </div>
          )}

          {content.pageType === 'contact' && (
            <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Contact intro</h2>
              <p className="text-xs text-muted-foreground">
                Phone, email, and map still use Settings → General. This text appears above the
                form when CMS rendering is enabled.
              </p>
              <RichTextEditor
                value={content.contactIntroHtml ?? ''}
                onChange={(html) => patchContent({ contactIntroHtml: html })}
                disabled={saving}
                compact
                editorMinHeight="min-h-[160px]"
              />
            </div>
          )}

          {content.pageType === 'give' && (
            <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Giving intro</h2>
              <p className="text-xs text-muted-foreground">
                QR codes remain under Settings → General and QR Codes admin.
              </p>
              <RichTextEditor
                value={content.donationIntroHtml ?? ''}
                onChange={(html) => patchContent({ donationIntroHtml: html })}
                disabled={saving}
                compact
                editorMinHeight="min-h-[160px]"
              />
            </div>
          )}

          {content.pageType === 'live' && (
            <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Live stream</h2>
              <div className="space-y-1.5">
                <Label>YouTube or stream URL</Label>
                <Input
                  value={content.liveStreamUrl ?? ''}
                  onChange={(e) => patchContent({ liveStreamUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={saving}
                />
              </div>
            </div>
          )}

          {(content.pageType === 'fire_service' ||
            content.pageType === 'home' ||
            content.pageType === 'custom') && (
            <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="space-y-1.5">
                <Label>CTA button label</Label>
                <Input
                  value={content.ctaLabel ?? ''}
                  onChange={(e) => patchContent({ ctaLabel: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label>CTA link</Label>
                <Input
                  value={content.ctaUrl ?? ''}
                  onChange={(e) => patchContent({ ctaUrl: e.target.value })}
                  placeholder="/events"
                  disabled={saving}
                />
              </div>
            </div>
          )}

          {content.pageType === 'listing' && (
            <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
              Listing items ({content.listingTarget}) are managed in their own admin section
              (Posts, Sermons, Events, etc.). Edit the hero and intro here only.
            </div>
          )}

          {!['contact', 'give'].includes(content.pageType) && (
            <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Main content</h2>
              <RichTextEditor
                value={content.bodyHtml ?? ''}
                onChange={(html) => patchContent({ bodyHtml: html })}
                placeholder="Write page body content…"
                disabled={saving}
              />
            </div>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <Label>Published</Label>
              <Switch
                checked={status === 'published'}
                onCheckedChange={(c) => setStatus(c ? 'published' : 'draft')}
                disabled={saving}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {status === 'published'
                ? 'Marked published in CMS (not yet live on site).'
                : 'Draft — hidden until you publish and connect the front-end.'}
            </p>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save page'
              )}
            </Button>
          </div>

          <SeoPanel
            focusKeyword={seo.focusKeyword ?? ''}
            seoTitle={seo.metaTitle ?? title}
            metaDescription={seo.metaDescription ?? ''}
            content={content.bodyHtml ?? ''}
            slug={slug}
            featuredImage={hero.imageUrl ?? ''}
            publicUrl={`https://kdcuganda.org${publicPath}`}
            onFocusKeywordChange={(v) => patchSeo({ focusKeyword: v })}
            onSeoTitleChange={(v) => patchSeo({ metaTitle: v })}
            onMetaDescriptionChange={(v) => patchSeo({ metaDescription: v })}
            disabled={saving}
          />
        </div>
      </div>
    </form>
  )
}
