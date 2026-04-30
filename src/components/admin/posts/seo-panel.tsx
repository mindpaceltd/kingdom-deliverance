'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSeoScore } from './use-seo-score'
import { getSeoScoreColor } from '@/lib/posts-helpers'
import { cn } from '@/lib/utils'
import { CheckIcon, XIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeoPanelProps {
  focusKeyword: string
  seoTitle: string
  metaDescription: string
  content: string
  slug: string
  featuredImage: string
  publicUrl: string
  onFocusKeywordChange: (v: string) => void
  onSeoTitleChange: (v: string) => void
  onMetaDescriptionChange: (v: string) => void
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function CharCounter({
  current,
  min,
  max,
}: {
  current: number
  min: number
  max: number
}) {
  const inRange = current >= min && current <= max
  return (
    <span
      className={cn(
        'text-xs tabular-nums',
        inRange ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
      )}
    >
      {current} / {min}–{max}
    </span>
  )
}

function CheckItem({ label, passing, points }: { label: string; passing: boolean; points: string }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      {passing ? (
        <CheckIcon className="size-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" aria-hidden="true" />
      ) : (
        <XIcon className="size-3.5 shrink-0 mt-0.5 text-destructive" aria-hidden="true" />
      )}
      <span className={cn('flex-1', passing ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      <span className="text-muted-foreground shrink-0">{points}</span>
    </li>
  )
}

// ---------------------------------------------------------------------------
// SeoPanel
// ---------------------------------------------------------------------------

export function SeoPanel({
  focusKeyword,
  seoTitle,
  metaDescription,
  content,
  slug,
  featuredImage,
  publicUrl,
  onFocusKeywordChange,
  onSeoTitleChange,
  onMetaDescriptionChange,
  disabled = false,
}: SeoPanelProps) {
  const { score, checks } = useSeoScore({
    focusKeyword,
    seoTitle,
    metaDescription,
    content,
    slug,
    featuredImage,
  })

  const scoreColor = getSeoScoreColor(score)

  const scoreColorClass = {
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    green: 'text-green-600 dark:text-green-400',
  }[scoreColor]

  const scoreBgClass = {
    red: 'bg-red-100 dark:bg-red-900/30',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
    green: 'bg-green-100 dark:bg-green-900/30',
  }[scoreColor]

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Header with live score */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">SEO</h3>
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
            scoreBgClass,
            scoreColorClass
          )}
          aria-label={`SEO score: ${score} out of 100`}
        >
          {score}
          <span className="font-normal opacity-70">/ 100</span>
        </div>
      </div>

      {/* Focus Keyword */}
      <div className="space-y-1.5">
        <Label htmlFor="seo-focus-keyword" className="text-xs font-medium">
          Focus Keyword
        </Label>
        <Input
          id="seo-focus-keyword"
          value={focusKeyword}
          onChange={(e) => onFocusKeywordChange(e.target.value)}
          placeholder="e.g. kingdom deliverance"
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>

      {/* SEO Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="seo-title" className="text-xs font-medium">
            SEO Title
          </Label>
          <CharCounter current={seoTitle.length} min={50} max={60} />
        </div>
        <Input
          id="seo-title"
          value={seoTitle}
          onChange={(e) => onSeoTitleChange(e.target.value)}
          placeholder="SEO-optimized title (50–60 chars)"
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>

      {/* Meta Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="seo-meta-description" className="text-xs font-medium">
            Meta Description
          </Label>
          <CharCounter current={metaDescription.length} min={150} max={160} />
        </div>
        <Textarea
          id="seo-meta-description"
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          placeholder="Brief description for search engines (150–160 chars)"
          disabled={disabled}
          rows={3}
          className="text-sm resize-none"
        />
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Checks
        </p>
        <ul className="space-y-1.5" aria-label="SEO checklist">
          <CheckItem
            label="Focus keyword in SEO title"
            passing={checks.keywordInTitle}
            points="+15 pts"
          />
          <CheckItem
            label="Focus keyword in first 200 characters"
            passing={checks.keywordInIntro}
            points="+15 pts"
          />
          <CheckItem
            label="Meta description length (150–160 chars)"
            passing={checks.metaDescriptionLength}
            points="+15 pts"
          />
          <CheckItem
            label="SEO title length (50–60 chars)"
            passing={checks.seoTitleLength}
            points="+15 pts"
          />
          <CheckItem
            label="Content word count ≥ 300 words"
            passing={checks.contentWordCount}
            points="+15 pts"
          />
          <CheckItem
            label="Featured image present"
            passing={checks.featuredImagePresent}
            points="+10 pts"
          />
          <CheckItem
            label="Focus keyword in slug"
            passing={checks.keywordInSlug}
            points="+15 pts"
          />
        </ul>
      </div>

      {/* Google-style search result preview */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Search Preview
        </p>
        <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3 space-y-0.5">
          {/* Title */}
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
            {seoTitle || 'Post Title'}
          </p>
          {/* URL */}
          <p className="text-xs text-green-700 dark:text-green-500 truncate">
            {publicUrl}
          </p>
          {/* Meta description */}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {metaDescription || 'No meta description provided.'}
          </p>
        </div>
      </div>
    </div>
  )
}
