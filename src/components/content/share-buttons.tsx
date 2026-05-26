'use client'

import * as React from 'react'
import { Check, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ShareButtonsProps {
  url: string
  title: string
  /** Shown in WhatsApp / optional tweet context */
  text?: string
  className?: string
  label?: string
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-13h4v2a4 4 0 0 1 4-2zM2 9h4v13H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  )
}

export function ShareButtons({ url, title, text, className, label = 'Share this event:' }: ShareButtonsProps) {
  const [copied, setCopied] = React.useState(false)
  const shareText = text || title
  const enc = encodeURIComponent

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const btn =
    'inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {label ? <span className="text-sm text-muted-foreground">{label}</span> : null}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
          className={cn(btn, 'bg-blue-600 hover:bg-blue-700')}
        >
          <FacebookIcon className="h-4 w-4" />
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
          className={cn(btn, 'bg-black hover:bg-zinc-800')}
        >
          <XIcon className="h-3.5 w-3.5" />
        </a>
        <a
          href={`https://wa.me/?text=${enc(`${shareText} ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
          className={cn(btn, 'bg-green-500 hover:bg-green-600')}
        >
          <WhatsAppIcon className="h-4 w-4" />
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
          className={cn(btn, 'bg-[#0A66C2] hover:bg-[#004182]')}
        >
          <LinkedInIcon className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copy link"
          className={cn(btn, copied ? 'bg-green-600 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600')}
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
