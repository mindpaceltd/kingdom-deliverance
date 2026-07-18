'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CmsSizedImageField } from '@/components/admin/pages/cms-sized-image-field'
import { getPageHeroImageSpec } from '@/lib/cms/page-image-specs'
import { defaultAboutDetails } from '@/lib/cms/about-page-defaults'
import type {
  CmsAboutDetails,
  CmsAboutFoundationCard,
  CmsAboutLeader,
  CmsAboutTimelineItem,
  CmsPageContent,
} from '@/lib/cms/page-content'
import { Plus, Trash2 } from 'lucide-react'

interface AboutPageEditorFieldsProps {
  content: CmsPageContent
  onChange: (patch: Partial<CmsPageContent>) => void
  disabled?: boolean
}

export function AboutPageEditorFields({
  content,
  onChange,
  disabled = false,
}: AboutPageEditorFieldsProps) {
  const defaults = defaultAboutDetails()
  const about: CmsAboutDetails = {
    ...defaults,
    ...content.about,
  }

  function patchAbout(patch: Partial<CmsAboutDetails>) {
    onChange({ about: { ...about, ...patch } })
  }

  function patchFoundationCards(cards: CmsAboutFoundationCard[]) {
    patchAbout({ foundationCards: cards })
  }

  function patchLeaders(leaders: CmsAboutLeader[]) {
    patchAbout({ leaders })
  }

  function patchTimeline(timeline: CmsAboutTimelineItem[]) {
    patchAbout({ timeline })
  }

  const heroSpec = getPageHeroImageSpec('about')
  const foundationCards = about.foundationCards ?? defaults.foundationCards ?? []
  const leaders = about.leaders ?? defaults.leaders ?? []
  const timeline = about.timeline ?? defaults.timeline ?? []

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Foundation (Mission, Vision, Values)</h2>
        <p className="text-xs text-muted-foreground">
          The three cards shown under &quot;Built on Purpose&quot; on the public About page.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Section badge</Label>
            <Input
              value={about.foundationBadge ?? defaults.foundationBadge ?? ''}
              onChange={(e) => patchAbout({ foundationBadge: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Section heading</Label>
            <Input
              value={about.foundationTitle ?? defaults.foundationTitle ?? ''}
              onChange={(e) => patchAbout({ foundationTitle: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="space-y-4">
          {foundationCards.map((card, idx) => (
            <div key={idx} className="space-y-2 rounded-lg border border-dashed p-4">
              <div className="flex items-center justify-between">
                <Label>Card {idx + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={disabled || foundationCards.length <= 1}
                  onClick={() => {
                    const next = [...foundationCards]
                    next.splice(idx, 1)
                    patchFoundationCards(next)
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Input
                value={card.label}
                onChange={(e) => {
                  const next = [...foundationCards]
                  next[idx] = { ...next[idx], label: e.target.value }
                  patchFoundationCards(next)
                }}
                placeholder="Our Mission"
                disabled={disabled}
              />
              <Textarea
                value={card.text}
                onChange={(e) => {
                  const next = [...foundationCards]
                  next[idx] = { ...next[idx], text: e.target.value }
                  patchFoundationCards(next)
                }}
                rows={3}
                disabled={disabled}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              patchFoundationCards([...foundationCards, { label: '', text: '' }])
            }
          >
            <Plus className="mr-1 size-3" /> Add card
          </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Leadership</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Section badge</Label>
            <Input
              value={about.leadershipBadge ?? defaults.leadershipBadge ?? ''}
              onChange={(e) => patchAbout({ leadershipBadge: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Section heading</Label>
            <Input
              value={about.leadershipTitle ?? defaults.leadershipTitle ?? ''}
              onChange={(e) => patchAbout({ leadershipTitle: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="space-y-4">
          {leaders.map((leader, idx) => (
            <div key={idx} className="space-y-3 rounded-lg border border-dashed p-4">
              <div className="flex items-center justify-between">
                <Label>Leader {idx + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={disabled || leaders.length <= 1}
                  onClick={() => {
                    const next = [...leaders]
                    next.splice(idx, 1)
                    patchLeaders(next)
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Input
                value={leader.name}
                onChange={(e) => {
                  const next = [...leaders]
                  next[idx] = { ...next[idx], name: e.target.value }
                  patchLeaders(next)
                }}
                placeholder="Name"
                disabled={disabled}
              />
              <Input
                value={leader.title}
                onChange={(e) => {
                  const next = [...leaders]
                  next[idx] = { ...next[idx], title: e.target.value }
                  patchLeaders(next)
                }}
                placeholder="Title / role"
                disabled={disabled}
              />
              <Textarea
                value={leader.bio}
                onChange={(e) => {
                  const next = [...leaders]
                  next[idx] = { ...next[idx], bio: e.target.value }
                  patchLeaders(next)
                }}
                rows={3}
                placeholder="Short bio"
                disabled={disabled}
              />
              <CmsSizedImageField
                spec={heroSpec}
                value={leader.imageUrl ?? ''}
                onChange={(url) => {
                  const next = [...leaders]
                  next[idx] = { ...next[idx], imageUrl: url }
                  patchLeaders(next)
                }}
                disabled={disabled}
                pickerLabel="Leader photo"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              patchLeaders([...leaders, { name: '', title: '', bio: '', imageUrl: '' }])
            }
          >
            <Plus className="mr-1 size-3" /> Add leader
          </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">History timeline</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Section badge</Label>
            <Input
              value={about.timelineBadge ?? defaults.timelineBadge ?? ''}
              onChange={(e) => patchAbout({ timelineBadge: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Section heading</Label>
            <Input
              value={about.timelineTitle ?? defaults.timelineTitle ?? ''}
              onChange={(e) => patchAbout({ timelineTitle: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="space-y-3">
          {timeline.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-2 rounded-lg border border-dashed p-4 sm:flex-row">
              <div className="space-y-1.5 sm:w-28">
                <Label>Year</Label>
                <Input
                  value={item.year}
                  onChange={(e) => {
                    const next = [...timeline]
                    next[idx] = { ...next[idx], year: e.target.value }
                    patchTimeline(next)
                  }}
                  placeholder="2026"
                  disabled={disabled}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>Event</Label>
                <Textarea
                  value={item.event}
                  onChange={(e) => {
                    const next = [...timeline]
                    next[idx] = { ...next[idx], event: e.target.value }
                    patchTimeline(next)
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="self-end text-destructive sm:self-center"
                disabled={disabled || timeline.length <= 1}
                onClick={() => {
                  const next = [...timeline]
                  next.splice(idx, 1)
                  patchTimeline(next)
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => patchTimeline([...timeline, { year: '', event: '' }])}
          >
            <Plus className="mr-1 size-3" /> Add timeline entry
          </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Kingdom Temple affiliation</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Section badge</Label>
            <Input
              value={about.affiliationBadge ?? defaults.affiliationBadge ?? ''}
              onChange={(e) => patchAbout({ affiliationBadge: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Section heading</Label>
            <Input
              value={about.affiliationTitle ?? defaults.affiliationTitle ?? ''}
              onChange={(e) => patchAbout({ affiliationTitle: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Body text</Label>
          <Textarea
            value={about.affiliationText ?? defaults.affiliationText ?? ''}
            onChange={(e) => patchAbout({ affiliationText: e.target.value })}
            rows={5}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
