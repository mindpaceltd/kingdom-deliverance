'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Info, Plus, Trash2 } from 'lucide-react'
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
import { CmsSizedImageField } from '@/components/admin/pages/cms-sized-image-field'
import { PageSeoPanel, indexCmsPageUrl } from '@/components/admin/pages/page-seo-panel'
import {
  BODY_IMAGE_SPEC,
  getPageHeroImageSpec,
} from '@/lib/cms/page-image-specs'
import { buildPublicPageUrl } from '@/lib/seo/public-content-urls'
import { createPage, updatePageFromEditor } from '@/lib/actions/pages'
import { defaultContactDetails } from '@/lib/cms/contact-page-defaults'
import { defaultAboutDetails } from '@/lib/cms/about-page-defaults'
import { defaultHomeDetails } from '@/lib/cms/home-page-defaults'
import { defaultFaqDetails } from '@/lib/cms/faq-page-defaults'
import { AboutPageEditorFields } from '@/components/admin/pages/about-page-editor-fields'
import { HomePageEditorFields } from '@/components/admin/pages/home-page-editor-fields'
import { FaqPageEditorFields } from '@/components/admin/pages/faq-page-editor-fields'
import {
  buildContentJson,
  pagePathFromSlug,
  pageTypeLabel,
  parsePageContent,
  type CmsContactDetails,
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
  const publicUrl = buildPublicPageUrl(slug === 'home' ? 'home' : slug)
  const heroImageSpec = getPageHeroImageSpec(content.pageType)

  function patchContent(patch: Partial<CmsPageContent>) {
    setContent((prev) => ({ ...prev, ...patch }))
  }

  function patchContact(patch: Partial<CmsContactDetails>) {
    setContent((prev) => ({
      ...prev,
      contact: { ...defaultContactDetails(), ...prev.contact, ...patch },
    }))
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

    if (status === 'published' && !content.seo?.noIndex) {
      const url =
        content.seo?.canonicalUrl?.trim() ||
        buildPublicPageUrl(slug === 'home' ? 'home' : slug)
      await indexCmsPageUrl(url)
    }

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
        {content.pageType === 'home' ? (
          <>
            Homepage sections, images, and video links are managed here. When this page is{' '}
            <strong>Published</strong>, <a href="https://kdcuganda.org/">kdcuganda.org</a> uses
            this content (products, sermons, events, and posts still load from their admin areas).
          </>
        ) : content.pageType === 'faq' ? (
          <>
            FAQ headings, sections, questions, and the help box are managed here. Set this page
            to <strong>Published</strong> for changes to appear on{' '}
            <a href="https://kdcuganda.org/faq">kdcuganda.org/faq</a>. Use the Hero panel above
            for the page title and background image.
          </>
        ) : (
          <>
            Content is saved in the CMS only. The public site still uses the existing Next.js
            pages until front-end rendering is connected. Planned URL:{' '}
            <code className="font-mono text-xs">{publicPath}</code>
          </>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
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

          <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
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
              <div className="sm:col-span-2">
                <CmsSizedImageField
                  spec={heroImageSpec}
                  value={hero.imageUrl ?? ''}
                  onChange={(url) => patchHero({ imageUrl: url })}
                  disabled={saving}
                  pickerLabel="Hero background"
                />
              </div>
            </div>
          </div>

          {content.pageType === 'about' && (
            <AboutPageEditorFields
              content={content}
              onChange={(patch) => {
                if (patch.about) {
                  setContent((prev) => ({
                    ...prev,
                    ...patch,
                    about: { ...defaultAboutDetails(), ...prev.about, ...patch.about },
                  }))
                } else {
                  patchContent(patch)
                }
              }}
              disabled={saving}
            />
          )}

          {content.pageType === 'home' && (
            <HomePageEditorFields
              content={content}
              onChange={(patch) =>
                setContent((prev) => ({
                  ...prev,
                  ...patch,
                  home: { ...defaultHomeDetails(), ...prev.home, ...patch.home },
                }))
              }
              disabled={saving}
            />
          )}

          {content.pageType === 'faq' && (
            <FaqPageEditorFields
              content={content}
              onChange={(patch) =>
                setContent((prev) => ({
                  ...prev,
                  ...patch,
                  faq: { ...defaultFaqDetails(), ...prev.faq, ...patch.faq },
                }))
              }
              disabled={saving}
            />
          )}

          {content.pageType === 'contact' && (
            <>
              <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Find us & map</h2>
                <p className="text-xs text-muted-foreground">
                  All text and links shown on the public contact page. Empty fields fall back to
                  site defaults until you save.
                </p>
                <div className="space-y-1.5">
                  <Label>Section heading</Label>
                  <Input
                    value={content.contact?.findUsTitle ?? defaultContactDetails().findUsTitle ?? ''}
                    onChange={(e) => patchContact({ findUsTitle: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Textarea
                    value={content.contact?.address ?? defaultContactDetails().address ?? ''}
                    onChange={(e) => patchContact({ address: e.target.value })}
                    rows={3}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Primary phone</Label>
                  <Input
                    value={content.contact?.primaryPhone ?? defaultContactDetails().primaryPhone ?? ''}
                    onChange={(e) => patchContact({ primaryPhone: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Additional phones</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => {
                        const current = content.contact?.additionalPhones ?? []
                        patchContact({ additionalPhones: [...current, ''] })
                      }}
                    >
                      <Plus className="size-3 mr-1" />
                      Add phone
                    </Button>
                  </div>
                  {(content.contact?.additionalPhones ?? []).map((phone, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={phone}
                        onChange={(e) => {
                          const current = [...(content.contact?.additionalPhones ?? [])]
                          current[idx] = e.target.value
                          patchContact({ additionalPhones: current })
                        }}
                        placeholder="+256 …"
                        disabled={saving}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive shrink-0"
                        disabled={saving}
                        onClick={() => {
                          const current = [...(content.contact?.additionalPhones ?? [])]
                          current.splice(idx, 1)
                          patchContact({ additionalPhones: current })
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={content.contact?.email ?? defaultContactDetails().email ?? ''}
                    onChange={(e) => patchContact({ email: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Service times</Label>
                  <Textarea
                    value={content.contact?.serviceTimes ?? defaultContactDetails().serviceTimes ?? ''}
                    onChange={(e) => patchContact({ serviceTimes: e.target.value })}
                    rows={4}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Google Maps embed URL</Label>
                  <Textarea
                    value={content.contact?.mapEmbedUrl ?? defaultContactDetails().mapEmbedUrl ?? ''}
                    onChange={(e) => patchContact({ mapEmbedUrl: e.target.value })}
                    rows={2}
                    className="font-mono text-xs"
                    disabled={saving}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Maps link URL</Label>
                    <Input
                      value={content.contact?.mapLinkUrl ?? defaultContactDetails().mapLinkUrl ?? ''}
                      onChange={(e) => patchContact({ mapLinkUrl: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Maps link label</Label>
                    <Input
                      value={content.contact?.mapLinkLabel ?? defaultContactDetails().mapLinkLabel ?? ''}
                      onChange={(e) => patchContact({ mapLinkLabel: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Contact form</h2>
                <div className="space-y-1.5">
                  <Label>Form heading</Label>
                  <Input
                    value={content.contact?.formTitle ?? defaultContactDetails().formTitle ?? ''}
                    onChange={(e) => patchContact({ formTitle: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Success title</Label>
                  <Input
                    value={
                      content.contact?.formSuccessTitle ??
                      defaultContactDetails().formSuccessTitle ??
                      ''
                    }
                    onChange={(e) => patchContact({ formSuccessTitle: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Success message</Label>
                  <Textarea
                    value={
                      content.contact?.formSuccessMessage ??
                      defaultContactDetails().formSuccessMessage ??
                      ''
                    }
                    onChange={(e) => patchContact({ formSuccessMessage: e.target.value })}
                    rows={3}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Submit button label</Label>
                  <Input
                    value={
                      content.contact?.submitButtonLabel ??
                      defaultContactDetails().submitButtonLabel ??
                      ''
                    }
                    onChange={(e) => patchContact({ submitButtonLabel: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Optional intro (rich text)</h2>
                <p className="text-xs text-muted-foreground">
                  Shown below the hero and above the contact grid when provided.
                </p>
                <RichTextEditor
                  value={content.contactIntroHtml ?? ''}
                  onChange={(html) => patchContent({ contactIntroHtml: html })}
                  disabled={saving}
                  compact
                  editorMinHeight="min-h-[120px]"
                />
              </div>
            </>
          )}

          {content.pageType === 'give' && (
            <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
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
            <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
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
            content.pageType === 'custom') && (
            <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
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

          {!['contact', 'give', 'about', 'home', 'faq'].includes(content.pageType) && (
            <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold">Main content</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {BODY_IMAGE_SPEC.label}: {BODY_IMAGE_SPEC.width}px+ wide — {BODY_IMAGE_SPEC.hint}
                </p>
              </div>
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
                ? 'Published in CMS. Saving submits the public URL to Google for indexing (unless noindex).'
                : 'Draft — publish to enable Google indexing.'}
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

          <PageSeoPanel
            seo={seo}
            title={title}
            slug={slug}
            bodyHtml={content.bodyHtml ?? ''}
            heroImageUrl={hero.imageUrl ?? ''}
            publicUrl={publicUrl}
            isPublished={status === 'published'}
            onChange={(patch) => patchSeo(patch)}
            disabled={saving}
          />
        </div>
      </div>
    </form>
  )
}
