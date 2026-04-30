'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  Share2Icon,
  CopyIcon,
  CheckIcon,
  LinkIcon,
  MessageCircleIcon,
} from 'lucide-react'

// Social icons as inline SVGs (not all are in this version of lucide-react)
function FacebookSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function TwitterSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SharePanelProps {
  title: string
  excerpt: string
  featuredImage: string
  slug: string
  status: 'draft' | 'published' | 'scheduled'
}

// ---------------------------------------------------------------------------
// SharePanel
// ---------------------------------------------------------------------------

export function SharePanel({
  title,
  excerpt,
  featuredImage,
  slug,
  status,
}: SharePanelProps) {
  const [copied, setCopied] = React.useState(false)

  const publicUrl = slug
    ? `https://kdcuganda.org/blog/${slug}`
    : 'https://kdcuganda.org/blog'

  const displayTitle = title || 'Untitled Post'
  const displayExcerpt = excerpt || 'Read this post on the KDC Uganda website.'

  // ---------------------------------------------------------------------------
  // Copy link
  // ---------------------------------------------------------------------------

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = publicUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ---------------------------------------------------------------------------
  // Share links
  // ---------------------------------------------------------------------------

  const encodedUrl = encodeURIComponent(publicUrl)
  const encodedTitle = encodeURIComponent(displayTitle)

  const shareLinks = [
    {
      label: 'Facebook',
      Icon: FacebookSvg,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:text-blue-600',
    },
    {
      label: 'Twitter / X',
      Icon: TwitterSvg,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'hover:text-sky-500',
    },
    {
      label: 'WhatsApp',
      Icon: MessageCircleIcon,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'hover:text-green-600',
    },
  ]

  const isPublished = status === 'published'

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Share2Icon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Share</h3>
      </div>

      {/* OG-style social preview card */}
      <div className="rounded-lg border border-border overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        {/* Featured image */}
        {featuredImage ? (
          <div className="relative aspect-[1.91/1] w-full overflow-hidden bg-muted">
            <Image
              src={featuredImage}
              alt={displayTitle}
              fill
              sizes="280px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="aspect-[1.91/1] w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No featured image</span>
          </div>
        )}

        {/* Text preview */}
        <div className="p-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            kdcuganda.org
          </p>
          <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
            {displayTitle}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {displayExcerpt}
          </p>
        </div>
      </div>

      {/* URL bar */}
      <div className="flex items-center gap-1.5 rounded-md border border-input bg-muted/40 px-2.5 py-1.5">
        <LinkIcon className="size-3 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-xs text-muted-foreground font-mono">
          {publicUrl}
        </span>
        <button
          type="button"
          onClick={handleCopyLink}
          className={cn(
            'shrink-0 rounded p-0.5 transition-colors',
            copied
              ? 'text-green-600'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title="Copy link"
          aria-label="Copy link"
        >
          {copied ? (
            <CheckIcon className="size-3.5" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </button>
      </div>

      {/* Share buttons */}
      {isPublished ? (
        <div className="flex items-center gap-2">
          {shareLinks.map(({ label, Icon, href, color }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={`Share on ${label}`}
              aria-label={`Share on ${label}`}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border',
                'text-muted-foreground transition-colors hover:bg-muted',
                color
              )}
            >
              <Icon className="size-4" />
            </a>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="ml-auto gap-1.5 text-xs"
          >
            {copied ? (
              <CheckIcon className="size-3.5 text-green-600" />
            ) : (
              <CopyIcon className="size-3.5" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-1">
          Publish this post to enable sharing.
        </p>
      )}
    </div>
  )
}
