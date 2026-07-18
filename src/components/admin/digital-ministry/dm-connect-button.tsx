'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { disconnectDmPlatform, refreshYouTubeStats } from '@/lib/digital-ministry/accounts'
import type { DmPlatform } from '@/lib/digital-ministry/types'
import { Loader2 } from 'lucide-react'

const DM_ACCOUNTS = '/admin/digital-ministry/accounts'

type Props = {
  platform: DmPlatform
  status?: string | null
  accountId?: string | null
  metaConfigured?: boolean
  googleConfigured?: boolean
}

export function DmConnectButton({
  platform,
  status,
  accountId,
  metaConfigured = false,
  googleConfigured = true,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const connected = status === 'connected' || status === 'limited'

  const connectHref = (() => {
    if (platform === 'youtube' || platform === 'website' || platform === 'google_business') {
      return `/api/google/auth?reconnect=1&returnTo=${encodeURIComponent(DM_ACCOUNTS)}`
    }
    if (platform === 'facebook' || platform === 'instagram') {
      return `/api/meta/auth?returnTo=${encodeURIComponent(DM_ACCOUNTS)}`
    }
    return null
  })()

  const canConnect =
    connectHref &&
    ((platform === 'facebook' || platform === 'instagram' ? metaConfigured : true) &&
      (platform === 'youtube' || platform === 'website' || platform === 'google_business'
        ? googleConfigured
        : true))

  function onConnect() {
    setError(null)
    if (!canConnect || !connectHref) {
      setError(
        platform === 'facebook' || platform === 'instagram'
          ? 'Set META_APP_ID and META_APP_SECRET in environment, then reload.'
          : 'Connector not available yet.'
      )
      return
    }
    window.location.href = connectHref
  }

  function onDisconnect() {
    setError(null)
    startTransition(async () => {
      const result = await disconnectDmPlatform(platform, accountId ?? undefined)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  function onRefreshYouTube() {
    setError(null)
    startTransition(async () => {
      const result = await refreshYouTubeStats()
      if ('error' in result && result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        {connected ? (
          <>
            <Button size="sm" variant="outline" onClick={onConnect} disabled={pending || !canConnect}>
              Reconnect
            </Button>
            {platform === 'youtube' ? (
              <Button size="sm" variant="secondary" onClick={onRefreshYouTube} disabled={pending}>
                {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                Sync
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={onDisconnect} disabled={pending}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={onConnect} disabled={pending || !canConnect}>
            {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
            Connect
          </Button>
        )}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!canConnect && connectHref === null ? (
        <p className="text-[11px] text-muted-foreground">Coming in a later phase.</p>
      ) : null}
      {(platform === 'facebook' || platform === 'instagram') && !metaConfigured ? (
        <p className="text-[11px] text-muted-foreground">
          Meta App credentials required (META_APP_ID / META_APP_SECRET).
        </p>
      ) : null}
    </div>
  )
}
