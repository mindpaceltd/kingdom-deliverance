'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  disconnectDmPlatform,
  manualConnectDmAccount,
  refreshYouTubeStats,
} from '@/lib/digital-ministry/accounts'
import type { DmPlatform } from '@/lib/digital-ministry/types'
import { Loader2 } from 'lucide-react'

const DM_ACCOUNTS = '/admin/digital-ministry/accounts'

const OAUTH_PLATFORMS = new Set<DmPlatform>([
  'youtube',
  'website',
  'google_business',
  'facebook',
  'instagram',
])

type Props = {
  platform: DmPlatform
  status?: string | null
  accountId?: string | null
  metaConfigured?: boolean
  googleConfigured?: boolean
  /** Compact mode for card grid */
  compact?: boolean
}

export function DmConnectButton({
  platform,
  status,
  accountId,
  metaConfigured = false,
  googleConfigured = true,
  compact = false,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualHandle, setManualHandle] = useState('')
  const connected = status === 'connected' || status === 'limited'

  const isMeta = platform === 'facebook' || platform === 'instagram'
  const isGoogle =
    platform === 'youtube' || platform === 'website' || platform === 'google_business'
  const isOauth = OAUTH_PLATFORMS.has(platform)

  const connectHref = (() => {
    if (isGoogle) {
      return `/api/google/auth?reconnect=1&returnTo=${encodeURIComponent(DM_ACCOUNTS)}`
    }
    if (isMeta) {
      return `/api/meta/auth?returnTo=${encodeURIComponent(DM_ACCOUNTS)}`
    }
    return null
  })()

  const oauthReady =
    isOauth &&
    connectHref &&
    (isMeta ? metaConfigured : true) &&
    (isGoogle ? googleConfigured : true)

  function onOauthConnect() {
    setError(null)
    if (!oauthReady || !connectHref) {
      if (isMeta && !metaConfigured) {
        setError('Set META_APP_ID and META_APP_SECRET, or use Manual connect below.')
        setShowManual(true)
        return
      }
      if (isGoogle && !googleConfigured) {
        setError('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first.')
        return
      }
      setShowManual(true)
      return
    }
    window.location.href = connectHref
  }

  function onManualConnect() {
    setError(null)
    if (!manualName.trim()) {
      setError('Enter the page or account name')
      return
    }
    startTransition(async () => {
      const result = await manualConnectDmAccount({
        platform,
        accountName: manualName,
        accountHandleOrUrl: manualHandle || manualName,
      })
      if (result.error) setError(result.error)
      else {
        setShowManual(false)
        setManualName('')
        setManualHandle('')
        router.refresh()
      }
    })
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
            {oauthReady ? (
              <Button size="sm" variant="outline" onClick={onOauthConnect} disabled={pending}>
                Reconnect API
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowManual(true)}
                disabled={pending}
              >
                Update
              </Button>
            )}
            {platform === 'youtube' && oauthReady ? (
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
          <>
            {isOauth ? (
              <Button size="sm" onClick={onOauthConnect} disabled={pending}>
                {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                {oauthReady ? 'Connect API' : isMeta ? 'Connect API' : 'Connect'}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant={isOauth ? 'outline' : 'default'}
              onClick={() => setShowManual((v) => !v)}
              disabled={pending}
            >
              {isOauth ? 'Manual connect' : 'Connect'}
            </Button>
          </>
        )}
      </div>

      {showManual ? (
        <div className={`mt-2 space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3 ${compact ? '' : ''}`}>
          <Input
            placeholder="Account / page name"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
          />
          <Input
            placeholder="Handle or profile URL (optional)"
            value={manualHandle}
            onChange={(e) => setManualHandle(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onManualConnect} disabled={pending}>
              {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
              Save connection
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowManual(false)} disabled={pending}>
              Cancel
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Registers this channel for Studio drafts and calendar. Publish uses Mark published when
            write APIs are unavailable.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {isMeta && !metaConfigured && !showManual ? (
        <p className="text-[11px] text-muted-foreground">
          META_APP_* optional — use Manual connect until credentials are added.
        </p>
      ) : null}
    </div>
  )
}
