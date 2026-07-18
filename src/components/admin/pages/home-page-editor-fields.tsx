'use client'

import { CmsSizedImageField } from '@/components/admin/pages/cms-sized-image-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { defaultHomeDetails } from '@/lib/cms/home-page-defaults'
import { HOME_SERMON_THUMB_SPEC } from '@/lib/cms/page-image-specs'
import type {
  CmsHomeFeature,
  CmsHomeStat,
  CmsHomeValueCard,
  CmsPageContent,
  CmsServiceSlot,
} from '@/lib/cms/page-content'
import { Plus, Trash2 } from 'lucide-react'

interface HomePageEditorFieldsProps {
  content: CmsPageContent
  onChange: (patch: Partial<CmsPageContent>) => void
  disabled?: boolean
}

export function HomePageEditorFields({
  content,
  onChange,
  disabled = false,
}: HomePageEditorFieldsProps) {
  const defaults = defaultHomeDetails()
  const home = { ...defaults, ...content.home }

  const serviceSlots = home.serviceSlots ?? []
  const stats = home.stats ?? []
  const features = home.features ?? []
  const values = home.values ?? []

  function patchHome(patch: Partial<typeof home>) {
    onChange({ home: { ...home, ...patch } })
  }

  function patchServiceSlots(next: CmsServiceSlot[]) {
    patchHome({ serviceSlots: next })
  }

  function patchStats(next: CmsHomeStat[]) {
    patchHome({ stats: next })
  }

  function patchFeatures(next: CmsHomeFeature[]) {
    patchHome({ features: next })
  }

  function patchValues(next: CmsHomeValueCard[]) {
    patchHome({ values: next })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Hero content</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Welcome pill text</Label>
            <Input
              value={home.heroWelcomeText ?? ''}
              onChange={(e) => patchHome({ heroWelcomeText: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Heading line 1</Label>
            <Input
              value={home.heroHeadingTop ?? ''}
              onChange={(e) => patchHome({ heroHeadingTop: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Heading line 2</Label>
            <Input
              value={home.heroHeadingBottom ?? ''}
              onChange={(e) => patchHome({ heroHeadingBottom: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Hero intro</Label>
            <Textarea
              value={home.heroLead ?? ''}
              onChange={(e) => patchHome({ heroLead: e.target.value })}
              rows={3}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Primary CTA label</Label>
            <Input
              value={home.heroPrimaryCtaLabel ?? ''}
              onChange={(e) => patchHome({ heroPrimaryCtaLabel: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Primary CTA URL</Label>
            <Input
              value={home.heroPrimaryCtaUrl ?? ''}
              onChange={(e) => patchHome({ heroPrimaryCtaUrl: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Secondary CTA label</Label>
            <Input
              value={home.heroSecondaryCtaLabel ?? ''}
              onChange={(e) => patchHome({ heroSecondaryCtaLabel: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Secondary CTA URL</Label>
            <Input
              value={home.heroSecondaryCtaUrl ?? ''}
              onChange={(e) => patchHome({ heroSecondaryCtaUrl: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Service schedule</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => patchServiceSlots([...serviceSlots, { label: '', time: '' }])}
          >
            <Plus className="mr-1 size-3" /> Add slot
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label>Schedule title</Label>
          <Input
            value={home.joinUsLabel ?? ''}
            onChange={(e) => patchHome({ joinUsLabel: e.target.value })}
            disabled={disabled}
          />
        </div>
        {serviceSlots.map((slot, idx) => (
          <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              value={slot.label}
              onChange={(e) => {
                const next = [...serviceSlots]
                next[idx] = { ...next[idx], label: e.target.value }
                patchServiceSlots(next)
              }}
              placeholder="Sunday Service"
              disabled={disabled}
            />
            <Input
              value={slot.time}
              onChange={(e) => {
                const next = [...serviceSlots]
                next[idx] = { ...next[idx], time: e.target.value }
                patchServiceSlots(next)
              }}
              placeholder="10:00 AM (EAT)"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              disabled={disabled || serviceSlots.length <= 1}
              onClick={() => {
                const next = [...serviceSlots]
                next.splice(idx, 1)
                patchServiceSlots(next)
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Mission and stats</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Mission badge</Label>
            <Input
              value={home.missionBadge ?? ''}
              onChange={(e) => patchHome({ missionBadge: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mission title</Label>
            <Input
              value={home.missionTitle ?? ''}
              onChange={(e) => patchHome({ missionTitle: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Mission body</Label>
            <Textarea
              value={home.missionBody ?? ''}
              onChange={(e) => patchHome({ missionBody: e.target.value })}
              rows={4}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Stats</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => patchStats([...stats, { value: '', label: '' }])}
            >
              <Plus className="mr-1 size-3" /> Add stat
            </Button>
          </div>
          {stats.map((stat, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-[130px_1fr_auto]">
              <Input
                value={stat.value}
                onChange={(e) => {
                  const next = [...stats]
                  next[idx] = { ...next[idx], value: e.target.value }
                  patchStats(next)
                }}
                placeholder="500+"
                disabled={disabled}
              />
              <Input
                value={stat.label}
                onChange={(e) => {
                  const next = [...stats]
                  next[idx] = { ...next[idx], label: e.target.value }
                  patchStats(next)
                }}
                placeholder="Church Members"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                disabled={disabled || stats.length <= 1}
                onClick={() => {
                  const next = [...stats]
                  next.splice(idx, 1)
                  patchStats(next)
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Grow With Us cards</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Section title</Label>
            <Input
              value={home.growTitle ?? ''}
              onChange={(e) => patchHome({ growTitle: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Section subtitle</Label>
            <Input
              value={home.growSubtitle ?? ''}
              onChange={(e) => patchHome({ growSubtitle: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
        {features.map((feature, idx) => (
          <div key={idx} className="space-y-2 rounded border p-3">
            <div className="flex items-center justify-between">
              <Label>Feature {idx + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                disabled={disabled || features.length <= 1}
                onClick={() => {
                  const next = [...features]
                  next.splice(idx, 1)
                  patchFeatures(next)
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Input
              value={feature.title}
              onChange={(e) => {
                const next = [...features]
                next[idx] = { ...next[idx], title: e.target.value }
                patchFeatures(next)
              }}
              placeholder="Title"
              disabled={disabled}
            />
            <Textarea
              value={feature.description}
              onChange={(e) => {
                const next = [...features]
                next[idx] = { ...next[idx], description: e.target.value }
                patchFeatures(next)
              }}
              rows={2}
              placeholder="Description"
              disabled={disabled}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={feature.link}
                onChange={(e) => {
                  const next = [...features]
                  next[idx] = { ...next[idx], link: e.target.value }
                  patchFeatures(next)
                }}
                placeholder="/sermons"
                disabled={disabled}
              />
              <Input
                value={feature.linkText}
                onChange={(e) => {
                  const next = [...features]
                  next[idx] = { ...next[idx], linkText: e.target.value }
                  patchFeatures(next)
                }}
                placeholder="Watch now"
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">KDC Store carousel</h2>
        <p className="text-xs text-muted-foreground">
          Product cards come from Admin → KDC Store. Edit section headings and links here.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            value={home.storeBadge ?? ''}
            onChange={(e) => patchHome({ storeBadge: e.target.value })}
            placeholder="Badge"
            disabled={disabled}
          />
          <Input
            value={home.storeTitle ?? ''}
            onChange={(e) => patchHome({ storeTitle: e.target.value })}
            placeholder="Section title"
            disabled={disabled}
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Subtitle</Label>
            <Input
              value={home.storeSubtitle ?? ''}
              onChange={(e) => patchHome({ storeSubtitle: e.target.value })}
              disabled={disabled}
            />
          </div>
          <Input
            value={home.storeViewAllLabel ?? ''}
            onChange={(e) => patchHome({ storeViewAllLabel: e.target.value })}
            placeholder="View all button"
            disabled={disabled}
          />
          <Input
            value={home.storeViewAllUrl ?? ''}
            onChange={(e) => patchHome({ storeViewAllUrl: e.target.value })}
            placeholder="/shop"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Recent Message (sermon)</h2>
        <p className="text-xs text-muted-foreground">
          Leave sermon slug empty to show the latest published sermon. Override thumbnail or video
          URL when needed.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            value={home.sermonBadge ?? ''}
            onChange={(e) => patchHome({ sermonBadge: e.target.value })}
            placeholder="Section badge"
            disabled={disabled}
          />
          <Input
            value={home.sermonTitle ?? ''}
            onChange={(e) => patchHome({ sermonTitle: e.target.value })}
            placeholder="Section title"
            disabled={disabled}
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Section subtitle</Label>
            <Input
              value={home.sermonSubtitle ?? ''}
              onChange={(e) => patchHome({ sermonSubtitle: e.target.value })}
              disabled={disabled}
            />
          </div>
          <Input
            value={home.sermonViewAllLabel ?? ''}
            onChange={(e) => patchHome({ sermonViewAllLabel: e.target.value })}
            placeholder="View all label"
            disabled={disabled}
          />
          <Input
            value={home.sermonViewAllUrl ?? ''}
            onChange={(e) => patchHome({ sermonViewAllUrl: e.target.value })}
            placeholder="/sermons"
            disabled={disabled}
          />
          <Input
            value={home.sermonFeaturedBadge ?? ''}
            onChange={(e) => patchHome({ sermonFeaturedBadge: e.target.value })}
            placeholder="Card badge"
            disabled={disabled}
          />
          <Input
            value={home.sermonWatchLabel ?? ''}
            onChange={(e) => patchHome({ sermonWatchLabel: e.target.value })}
            placeholder="Watch button"
            disabled={disabled}
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Featured sermon slug (optional)</Label>
            <Input
              value={home.sermonFeaturedSlug ?? ''}
              onChange={(e) => patchHome({ sermonFeaturedSlug: e.target.value })}
              placeholder="breaking-chains-walking-in-total-freedom"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Video / watch URL (optional)</Label>
            <Input
              value={home.sermonVideoUrl ?? ''}
              onChange={(e) => patchHome({ sermonVideoUrl: e.target.value })}
              placeholder="https://youtube.com/..."
              disabled={disabled}
            />
          </div>
        </div>
        <CmsSizedImageField
          spec={HOME_SERMON_THUMB_SPEC}
          value={home.sermonThumbnailUrl ?? ''}
          onChange={(url) => patchHome({ sermonThumbnailUrl: url })}
          disabled={disabled}
          pickerLabel="Sermon thumbnail"
        />
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Values section</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            value={home.valuesBadge ?? ''}
            onChange={(e) => patchHome({ valuesBadge: e.target.value })}
            placeholder="Badge"
            disabled={disabled}
          />
          <Input
            value={home.valuesTitle ?? ''}
            onChange={(e) => patchHome({ valuesTitle: e.target.value })}
            placeholder="Title"
            disabled={disabled}
          />
          <Input
            value={home.valuesSubtitle ?? ''}
            onChange={(e) => patchHome({ valuesSubtitle: e.target.value })}
            placeholder="Subtitle"
            disabled={disabled}
          />
        </div>
        {values.map((value, idx) => (
          <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <Input
              value={value.title}
              onChange={(e) => {
                const next = [...values]
                next[idx] = { ...next[idx], title: e.target.value }
                patchValues(next)
              }}
              placeholder="Value title"
              disabled={disabled}
            />
            <Input
              value={value.description}
              onChange={(e) => {
                const next = [...values]
                next[idx] = { ...next[idx], description: e.target.value }
                patchValues(next)
              }}
              placeholder="Value description"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              disabled={disabled || values.length <= 1}
              onClick={() => {
                const next = [...values]
                next.splice(idx, 1)
                patchValues(next)
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Upcoming events</h2>
        <p className="text-xs text-muted-foreground">
          Event cards are managed under Admin → Events.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            value={home.eventsBadge ?? ''}
            onChange={(e) => patchHome({ eventsBadge: e.target.value })}
            disabled={disabled}
          />
          <Input
            value={home.eventsTitle ?? ''}
            onChange={(e) => patchHome({ eventsTitle: e.target.value })}
            disabled={disabled}
          />
          <Input
            value={home.eventsViewAllLabel ?? ''}
            onChange={(e) => patchHome({ eventsViewAllLabel: e.target.value })}
            disabled={disabled}
          />
          <Input
            value={home.eventsViewAllUrl ?? ''}
            onChange={(e) => patchHome({ eventsViewAllUrl: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">News &amp; teachings (blog)</h2>
        <p className="text-xs text-muted-foreground">
          Post cards come from Admin → Posts &amp; Blogs.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            value={home.postsBadge ?? ''}
            onChange={(e) => patchHome({ postsBadge: e.target.value })}
            disabled={disabled}
          />
          <Input
            value={home.postsTitle ?? ''}
            onChange={(e) => patchHome({ postsTitle: e.target.value })}
            disabled={disabled}
          />
          <Input
            value={home.postsViewAllLabel ?? ''}
            onChange={(e) => patchHome({ postsViewAllLabel: e.target.value })}
            disabled={disabled}
          />
          <Input
            value={home.postsViewAllUrl ?? ''}
            onChange={(e) => patchHome({ postsViewAllUrl: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Testimonies</h2>
        <p className="text-xs text-muted-foreground">
          Testimony quotes come from Admin → Testimonies when approved.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            value={home.testimoniesBadge ?? ''}
            onChange={(e) => patchHome({ testimoniesBadge: e.target.value })}
            disabled={disabled}
          />
          <Input
            value={home.testimoniesTitle ?? ''}
            onChange={(e) => patchHome({ testimoniesTitle: e.target.value })}
            disabled={disabled}
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Section subtitle</Label>
            <Textarea
              value={home.testimoniesSubtitle ?? ''}
              onChange={(e) => patchHome({ testimoniesSubtitle: e.target.value })}
              rows={2}
              disabled={disabled}
            />
          </div>
          <Input
            value={home.testimoniesCtaTitle ?? ''}
            onChange={(e) => patchHome({ testimoniesCtaTitle: e.target.value })}
            placeholder="CTA title"
            disabled={disabled}
          />
          <Input
            value={home.testimoniesCtaLabel ?? ''}
            onChange={(e) => patchHome({ testimoniesCtaLabel: e.target.value })}
            placeholder="CTA button"
            disabled={disabled}
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>CTA description</Label>
            <Input
              value={home.testimoniesCtaBody ?? ''}
              onChange={(e) => patchHome({ testimoniesCtaBody: e.target.value })}
              disabled={disabled}
            />
          </div>
          <Input
            value={home.testimoniesCtaUrl ?? ''}
            onChange={(e) => patchHome({ testimoniesCtaUrl: e.target.value })}
            placeholder="/testimonies"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Fire service CTA banner</h2>
        <p className="text-sm text-muted-foreground">
          The Fire Service date in the banner updates automatically to the last Friday of each month.
        </p>
        <Input
          value={home.fireCtaTitle ?? ''}
          onChange={(e) => patchHome({ fireCtaTitle: e.target.value })}
          placeholder="🔥 The Fire Service 🔥"
          disabled={disabled}
        />
        <Textarea
          value={home.fireCtaBody ?? ''}
          onChange={(e) => patchHome({ fireCtaBody: e.target.value })}
          rows={3}
          placeholder="Banner description"
          disabled={disabled}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={home.fireCtaLabel ?? ''}
            onChange={(e) => patchHome({ fireCtaLabel: e.target.value })}
            placeholder="Button label"
            disabled={disabled}
          />
          <Input
            value={home.fireCtaUrl ?? ''}
            onChange={(e) => patchHome({ fireCtaUrl: e.target.value })}
            placeholder="/fire-service"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
