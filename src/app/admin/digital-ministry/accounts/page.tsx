import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DmCard, DmPageHeader, DmComingSoonBadge } from '@/components/admin/digital-ministry/dm-ui'
import { DM_PLATFORMS } from '@/lib/digital-ministry/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function SocialAccountsPage() {
  const supabase = createClient()
  const { data: accounts } = await supabase
    .from('dm_social_accounts')
    .select('id, platform, account_name, status, health_status, token_expires_at, last_synced_at')
    .is('deleted_at', null)

  const byPlatform = new Map((accounts ?? []).map((a: { platform: string }) => [a.platform, a]))

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Social Accounts"
        description="Connect official platform APIs. Where write access is restricted, we fall back to drafts, analytics, and manual publish."
        actions={<DmComingSoonBadge>OAuth connectors phased</DmComingSoonBadge>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DM_PLATFORMS.map((p) => {
          const connected = byPlatform.get(p.id)
          return (
            <DmCard key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold tracking-tight">{p.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground capitalize">
                    Publish: {p.publishSupport}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    connected?.status === 'connected'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {connected?.status ?? 'disconnected'}
                </span>
              </div>
              {p.note ? <p className="mt-3 text-xs text-muted-foreground">{p.note}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled>
                  Connect
                </Button>
                {['facebook','youtube','tiktok','x','linkedin','instagram'].includes(p.id) ? (
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/admin/digital-ministry/accounts/${p.id}`}>Details</Link>
                  </Button>
                ) : null}
              </div>
            </DmCard>
          )
        })}
      </div>

      <DmCard className="p-5 text-sm text-muted-foreground">
        YouTube / Google reuse the existing OAuth at{' '}
        <Link href="/admin/analytics" className="text-foreground underline underline-offset-2">
          Admin → Analytics
        </Link>
        . Meta, TikTok, and LinkedIn connectors will store encrypted tokens in{' '}
        <code className="text-xs">dm_social_accounts</code>.
      </DmCard>
    </div>
  )
}
