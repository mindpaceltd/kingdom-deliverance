'use client'

import { useEffect, useMemo, useState } from 'react'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  DM_PLATFORM_GUIDES,
  htmlToPlain,
  platformCaption,
  type PlatformGuide,
} from '@/lib/digital-ministry/platform-guides'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

function CharMeter({ count, limit, soft }: { count: number; limit: number; soft?: number }) {
  const over = count > limit
  const softWarn = soft != null && count > soft && !over
  return (
    <p
      className={cn(
        'text-[11px] tabular-nums font-medium',
        over ? 'text-destructive' : softWarn ? 'text-amber-700' : 'text-muted-foreground'
      )}
    >
      {count.toLocaleString()} / {limit.toLocaleString()}
      {over ? ' · over limit' : softWarn ? ' · long for feed' : ''}
    </p>
  )
}

function FacebookPreview({ text, title }: { text: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#CCD0D5] bg-white text-[#050505] shadow-sm">
      <div className="flex items-center gap-2.5 px-3 pt-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#1877F2] text-sm font-bold text-white">
          K
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight">Kingdom Deliverance Centre</p>
          <p className="text-[11px] text-[#65676B]">Just now · 🌐</p>
        </div>
      </div>
      <div className="whitespace-pre-wrap px-3 py-2.5 text-[15px] leading-snug">
        {text || <span className="text-[#65676B]">Your Facebook post will appear here…</span>}
      </div>
      <div className="mx-3 mb-3 flex h-36 items-center justify-center rounded-lg bg-gradient-to-br from-[#1877F2]/15 to-[#42B72A]/10 text-xs text-[#65676B]">
        {title ? `Link / media · ${title}` : 'Media or link preview'}
      </div>
      <div className="flex border-t border-[#CCD0D5] text-[12px] font-semibold text-[#65676B]">
        {['Like', 'Comment', 'Share'].map((a) => (
          <div key={a} className="flex-1 py-2.5 text-center">
            {a}
          </div>
        ))}
      </div>
    </div>
  )
}

function InstagramPreview({ text }: { text: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#DBDBDB] bg-white text-[#262626] shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="size-8 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]" />
        <p className="text-[13px] font-semibold">kdcuganda</p>
      </div>
      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#F58529]/20 via-[#DD2A7B]/15 to-[#8134AF]/20 text-xs text-[#8E8E8E]">
        Image / Reel required
      </div>
      <div className="space-y-1 px-3 py-2.5 text-[13px] leading-snug">
        <p>
          <span className="font-semibold">kdcuganda</span>{' '}
          <span className="whitespace-pre-wrap">
            {text || <span className="text-[#8E8E8E]">Caption preview…</span>}
          </span>
        </p>
      </div>
    </div>
  )
}

function XPreview({ text }: { text: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#CFD9DE] bg-white text-[#0F1419] shadow-sm">
      <div className="flex gap-3 p-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0F1419] text-sm font-bold text-white">
          K
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-tight">
            <span className="font-bold">KDC Uganda</span>{' '}
            <span className="text-[#536471]">@kdcuganda · now</span>
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-snug">
            {text || <span className="text-[#536471]">Your post on X…</span>}
          </p>
        </div>
      </div>
    </div>
  )
}

function LinkedInPreview({ text }: { text: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E0E0E0] bg-white text-[rgba(0,0,0,0.9)] shadow-sm">
      <div className="flex items-start gap-2.5 px-3 pt-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#0A66C2] text-sm font-bold text-white">
          K
        </div>
        <div>
          <p className="text-[14px] font-semibold leading-tight">Kingdom Deliverance Centre</p>
          <p className="text-[12px] text-[rgba(0,0,0,0.6)]">Ministry · 1m</p>
        </div>
      </div>
      <p className="whitespace-pre-wrap px-3 py-2.5 text-[14px] leading-snug">
        {text || <span className="text-[rgba(0,0,0,0.6)]">LinkedIn update preview…</span>}
      </p>
      <div className="mx-3 mb-3 h-28 rounded-lg bg-[#0A66C2]/10" />
    </div>
  )
}

function GenericPreview({
  guide,
  text,
  title,
}: {
  guide: PlatformGuide
  text: string
  title: string
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border bg-white shadow-sm"
      style={{ borderColor: `${guide.accent}33` }}
    >
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: guide.softBg }}>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
          style={{ background: guide.accent }}
        >
          {guide.label}
        </span>
        <span className="text-[11px] text-muted-foreground">{guide.previewHint}</span>
      </div>
      {title ? <p className="border-b px-3 py-2 text-sm font-semibold">{title}</p> : null}
      <p className="whitespace-pre-wrap px-3 py-3 text-sm leading-relaxed text-foreground/90">
        {text || 'Preview will appear when you write content…'}
      </p>
    </div>
  )
}

function PreviewFor({
  platform,
  text,
  title,
}: {
  platform: string
  text: string
  title: string
}) {
  if (platform === 'facebook') return <FacebookPreview text={text} title={title} />
  if (platform === 'instagram') return <InstagramPreview text={text} />
  if (platform === 'x') return <XPreview text={text} />
  if (platform === 'linkedin') return <LinkedInPreview text={text} />
  const guide = DM_PLATFORM_GUIDES[platform]
  if (!guide) return null
  return <GenericPreview guide={guide} text={text} title={title} />
}

export function DmPlatformPreviews({
  platforms,
  title,
  bodyHtml,
  overrides,
  onOverrideChange,
  trimEnabled,
  onTrimChange,
}: {
  platforms: string[]
  title: string
  bodyHtml: string
  overrides: Record<string, string>
  onOverrideChange: (platform: string, value: string) => void
  trimEnabled: boolean
  onTrimChange: (value: boolean) => void
}) {
  const [active, setActive] = useState(platforms[0] || 'facebook')

  const selected = useMemo(
    () => platforms.filter((p) => DM_PLATFORM_GUIDES[p]),
    [platforms]
  )

  const current = selected.includes(active) ? active : selected[0] || ''
  const guide = current ? DM_PLATFORM_GUIDES[current] : null

  useEffect(() => {
    if (selected.length && !selected.includes(active)) {
      setActive(selected[0])
    }
  }, [selected, active])

  if (!selected.length) {
    return (
      <DmCard className="p-5 text-sm text-muted-foreground">
        Select one or more platforms to see Bit Social–style recommendations and live previews.
      </DmCard>
    )
  }

  const caption = platformCaption(title, bodyHtml, current, overrides, trimEnabled)
  const plainLen = caption.length
  const over = guide ? plainLen > guide.charLimit : false

  return (
    <DmCard className="overflow-hidden p-0">
      <div className="border-b border-border/70 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Platform previews</p>
            <p className="text-xs text-muted-foreground">
              Recommendations + live mockups for each selected network (like{' '}
              <a
                href="https://bit-social.com/documentation/templates/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Bit Social templates
              </a>
              ).
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={trimEnabled}
              onChange={(e) => onTrimChange(e.target.checked)}
              className="size-3.5 rounded border"
            />
            Trim to platform limit
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.map((p) => {
            const g = DM_PLATFORM_GUIDES[p]
            const len = platformCaption(title, bodyHtml, p, overrides, trimEnabled).length
            const bad = len > g.charLimit
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActive(p)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  current === p
                    ? 'border-transparent text-white'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                )}
                style={current === p ? { background: g.accent } : undefined}
              >
                {g.label}
                {bad ? <AlertTriangle className="size-3" /> : <CheckCircle2 className="size-3 opacity-70" />}
              </button>
            )
          })}
        </div>
      </div>

      {guide && current ? (
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          <div className="space-y-4 border-b border-border/60 p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {guide.label} caption
                </p>
                <CharMeter count={plainLen} limit={guide.charLimit} soft={guide.softLimit} />
              </div>
              <Textarea
                className="mt-2 min-h-[140px] text-sm"
                value={overrides[current] ?? ''}
                placeholder={`Defaults to title + body. Override for ${guide.label}…`}
                onChange={(e) => onOverrideChange(current, e.target.value)}
              />
              {overrides[current] ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-1 h-7 px-2 text-xs"
                  onClick={() => onOverrideChange(current, '')}
                >
                  Reset to shared draft
                </Button>
              ) : (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Shared draft length: {htmlToPlain(bodyHtml).length.toLocaleString()} chars
                  {title ? ` · title “${title.slice(0, 40)}${title.length > 40 ? '…' : ''}”` : ''}
                </p>
              )}
              {over ? (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  Over {guide.label} limit — enable Trim or shorten the caption.
                </p>
              ) : null}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recommendations
              </p>
              <ul className="mt-2 space-y-2">
                {guide.recommendations.map((tip) => (
                  <li key={tip} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full"
                      style={{ background: guide.accent }}
                    />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-muted/20 p-4 sm:p-5" style={{ background: `${guide.softBg}55` }}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Live preview
            </p>
            <PreviewFor platform={current} text={caption} title={title} />
          </div>
        </div>
      ) : null}
    </DmCard>
  )
}
