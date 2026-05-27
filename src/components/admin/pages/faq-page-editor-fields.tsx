'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { defaultFaqDetails } from '@/lib/cms/faq-page-defaults'
import type { CmsFaqItem, CmsFaqSection, CmsPageContent } from '@/lib/cms/page-content'
import { Plus, Trash2 } from 'lucide-react'

interface FaqPageEditorFieldsProps {
  content: CmsPageContent
  onChange: (patch: Partial<CmsPageContent>) => void
  disabled?: boolean
}

export function FaqPageEditorFields({
  content,
  onChange,
  disabled = false,
}: FaqPageEditorFieldsProps) {
  const defaults = defaultFaqDetails()
  const faq = { ...defaults, ...content.faq }
  const sections = faq.sections ?? defaults.sections ?? []

  function patchFaq(patch: Partial<typeof faq>) {
    onChange({ faq: { ...faq, ...patch } })
  }

  function patchSections(next: CmsFaqSection[]) {
    patchFaq({ sections: next })
  }

  function updateSection(index: number, patch: Partial<CmsFaqSection>) {
    const next = [...sections]
    next[index] = { ...next[index], ...patch }
    patchSections(next)
  }

  function updateItem(sectionIndex: number, itemIndex: number, patch: Partial<CmsFaqItem>) {
    const next = [...sections]
    const items = [...(next[sectionIndex].items ?? [])]
    items[itemIndex] = { ...items[itemIndex], ...patch }
    next[sectionIndex] = { ...next[sectionIndex], items }
    patchSections(next)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">FAQ hero text</h2>
        <p className="text-xs text-muted-foreground">
          The main page title and hero background image are edited in the Hero panel above.
          Use the fields below for the subtitle and date line under the title.
        </p>
        <div className="space-y-1.5">
          <Label>Hero intro (subtitle under title)</Label>
          <Textarea
            value={faq.intro ?? ''}
            onChange={(e) => patchFaq({ intro: e.target.value })}
            rows={2}
            disabled={disabled}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Last updated label</Label>
            <Input
              value={faq.lastUpdatedLabel ?? ''}
              onChange={(e) => patchFaq({ lastUpdatedLabel: e.target.value })}
              placeholder="Last Updated:"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Last updated date</Label>
            <Input
              value={faq.lastUpdated ?? ''}
              onChange={(e) => patchFaq({ lastUpdated: e.target.value })}
              placeholder="May 27, 2026"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">FAQ sections</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              patchSections([...sections, { title: 'New section', items: [{ question: '', answer: '' }] }])
            }
          >
            <Plus className="mr-1 size-3" /> Add section
          </Button>
        </div>
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-3 rounded-lg border border-dashed p-4">
              <div className="flex items-center gap-2">
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                  placeholder="Section title"
                  disabled={disabled}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive shrink-0"
                  disabled={disabled || sections.length <= 1}
                  onClick={() => {
                    const next = [...sections]
                    next.splice(sectionIndex, 1)
                    patchSections(next)
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {(section.items ?? []).map((item, itemIndex) => (
                  <div key={itemIndex} className="space-y-2 rounded border p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.question}
                        onChange={(e) =>
                          updateItem(sectionIndex, itemIndex, { question: e.target.value })
                        }
                        placeholder="Question"
                        disabled={disabled}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive shrink-0"
                        disabled={disabled || (section.items?.length ?? 0) <= 1}
                        onClick={() => {
                          const next = [...sections]
                          const items = [...(next[sectionIndex].items ?? [])]
                          items.splice(itemIndex, 1)
                          next[sectionIndex] = { ...next[sectionIndex], items }
                          patchSections(next)
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={item.answer}
                      onChange={(e) =>
                        updateItem(sectionIndex, itemIndex, { answer: e.target.value })
                      }
                      placeholder="Answer"
                      rows={3}
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  const next = [...sections]
                  const items = [...(next[sectionIndex].items ?? []), { question: '', answer: '' }]
                  next[sectionIndex] = { ...next[sectionIndex], items }
                  patchSections(next)
                }}
              >
                <Plus className="mr-1 size-3" /> Add question
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Bottom help box</h2>
        <div className="space-y-1.5">
          <Label>Box title</Label>
          <Input
            value={faq.helpTitle ?? ''}
            onChange={(e) => patchFaq({ helpTitle: e.target.value })}
            placeholder="Still need help?"
            disabled={disabled}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Text before link</Label>
            <Input
              value={faq.helpMessageLead ?? ''}
              onChange={(e) => patchFaq({ helpMessageLead: e.target.value })}
              placeholder="Reach out on our"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Link label</Label>
            <Input
              value={faq.helpLinkLabel ?? ''}
              onChange={(e) => patchFaq({ helpLinkLabel: e.target.value })}
              placeholder="Contact page"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Link URL</Label>
            <Input
              value={faq.helpLinkUrl ?? ''}
              onChange={(e) => patchFaq({ helpLinkUrl: e.target.value })}
              placeholder="/contact"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Text after link</Label>
            <Input
              value={faq.helpMessageTail ?? ''}
              onChange={(e) => patchFaq({ helpMessageTail: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Or single paragraph (overrides link fields above)</Label>
          <Textarea
            value={faq.helpText ?? ''}
            onChange={(e) => patchFaq({ helpText: e.target.value })}
            rows={2}
            placeholder="Leave empty to use the link fields above"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
