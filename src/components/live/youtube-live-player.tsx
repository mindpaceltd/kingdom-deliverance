import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LiveStreamConfig } from '@/lib/live-stream'

export function YouTubeLivePlayer({ config }: { config: LiveStreamConfig }) {
  return (
    <div className="space-y-4">
      <div className="aspect-video overflow-hidden rounded-2xl bg-primary/20 shadow-2xl">
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
        <p className="text-sm text-white/75">
          When we are not live, open our YouTube channel to watch recent services and get notified for the next broadcast.
        </p>
        <Button asChild variant="outline" className="border-red-500/40 bg-white text-red-600 hover:bg-red-50">
          <Link href={config.channelLiveUrl} target="_blank" rel="noopener noreferrer">
            Open YouTube Live <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
