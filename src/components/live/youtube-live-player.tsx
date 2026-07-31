import Link from 'next/link'
import { ExternalLink, Radio, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LiveStreamConfig } from '@/lib/live-stream'

export function YouTubeLivePlayer({ config }: { config: LiveStreamConfig }) {
  const statusLabel = config.isLive
    ? 'Live now'
    : config.mode === 'recent'
      ? 'Recent service'
      : 'YouTube channel'

  const statusHint = config.isLive
    ? 'We are broadcasting live — join the service now.'
    : config.mode === 'recent'
      ? 'We are not live right now. Watch our most recent upload below, or open YouTube Live to get notified when we go on air.'
      : 'Open our YouTube channel for the latest services and live notifications.'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            config.isLive
              ? 'bg-red-600 text-white'
              : 'border border-white/20 bg-white/10 text-white/90'
          }`}
        >
          {config.isLive ? (
            <>
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              <Radio className="size-3.5" />
              Live
            </>
          ) : (
            <>
              <PlayCircle className="size-3.5" />
              {statusLabel}
            </>
          )}
        </span>
      </div>

      <div className="aspect-video overflow-hidden rounded-2xl bg-primary/20 shadow-2xl ring-1 ring-white/10">
        <iframe
          src={config.embedUrl}
          title="Kingdom Deliverance Centre Uganda Live Stream"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center sm:flex-row sm:text-left">
        <p className="text-sm text-white/75">{statusHint}</p>
        <Button asChild variant="outline" className="border-red-500/40 bg-white text-red-600 hover:bg-red-50">
          <Link href={config.channelLiveUrl} target="_blank" rel="noopener noreferrer">
            Open YouTube Live <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
