import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DmCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { DmConnectButton } from '@/components/admin/digital-ministry/dm-connect-button'
import { DM_PLATFORMS } from '@/lib/digital-ministry/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { metaConfigured } from '@/lib/meta/oauth'

function flashMessage(sp: { success?: string; error?: string }) {
  if (sp.success === 'google_connected') return { tone: 'ok' as const, text: 'Google / YouTube connected.' }
  if (sp.success === 'meta_connected') return { tone: 'ok' as const, text: 'Facebook / Instagram connected.' }
  if (sp.error) return { tone: 'err' as const, text: `Connection issue: ${sp.error.replace(/_/g, ' ')}` }
  return null
}

export default async function SocialAccountsPage({
  searchParams,
}: {
  searchParams?: { success?: string; error?: string }
}) {
  const supabase = createClient()
  const { data: accounts } = await supabase
    .from('dm_social_accounts')
    .select(
      'id, platform, account_name, account_id, status, health_status, health_message, token_expires_at, last_synced_at'
    )
    .is('deleted_at', null)
    .order('platform')

  type AccountRow = NonNullable<typeof accounts>[number]
  const byPlatform = new Map<string, AccountRow[]>()
  for (const a of accounts ?? []) {
    const list = byPlatform.get(a.platform) ?? []
    list.push(a)
    byPlatform.set(a.platform, list)
  }

  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  )
  const metaOk = metaConfigured()
  const flash = flashMessage(searchParams ?? {})

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Social Accounts"
        description="Connect official platform APIs. Tokens are encrypted at rest in dm_social_accounts."
      />

      {flash ? (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            flash.tone === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-destructive/30 bg-destructive/5 text-destructive'
          )}
        >
          {flash.text}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DM_PLATFORMS.map((p) => {
          const rows = byPlatform.get(p.id) ?? []
          const primary = rows[0]
          const connected =
            rows.some((r) => r.status === 'connected') ||
            rows.some((r) => r.status === 'limited')
          const badgeStatus = primary?.status ?? 'disconnected'

          return (
            <DmCard key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold tracking-tight">{p.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground capitalize">
                    Publish: {p.publishSupport}
                  </p>
                  {primary?.account_name ? (
                    <p className="mt-2 truncate text-sm text-foreground/90">{primary.account_name}</p>
                  ) : null}
                  {primary?.health_message ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {primary.health_message}
                    </p>
                  ) : null}
                  {rows.length > 1 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      +{rows.length - 1} more linked account{rows.length > 2 ? 's' : ''}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    connected
                      ? 'bg-emerald-50 text-emerald-700'
                      : badgeStatus === 'error'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {badgeStatus}
                </span>
              </div>
              {p.note ? <p className="mt-3 text-xs text-muted-foreground">{p.note}</p> : null}
              <div className="mt-4 space-y-3">
                <DmConnectButton
                  platform={p.id}
                  status={primary?.status}
                  accountId={primary?.account_id}
                  metaConfigured={metaOk}
                  googleConfigured={googleConfigured}
                />
                {['facebook', 'youtube', 'tiktok', 'x', 'linkedin', 'instagram'].includes(p.id) ? (
                  <Button size="sm" variant="ghost" className="h-8 px-2" asChild>
                    <Link href={`/admin/digital-ministry/accounts/${p.id}`}>Details</Link>
                  </Button>
                ) : null}
              </div>
            </DmCard>
          )
        })}
      </div>

      <DmCard className="space-y-2 p-5 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">YouTube / Google:</span> uses existing{' '}
          <code className="text-xs">GOOGLE_CLIENT_*</code> OAuth (Analytics + Search Console + YouTube
          readonly). Also available under{' '}
          <Link href="/admin/analytics" className="text-foreground underline underline-offset-2">
            Admin → Analytics
          </Link>
          .
        </p>
        <p>
          <span className="font-medium text-foreground">Facebook / Instagram:</span> requires{' '}
          <code className="text-xs">META_APP_ID</code> and <code className="text-xs">META_APP_SECRET</code>
          . Callback: <code className="text-xs">/api/meta/callback</code>
          {metaOk ? ' · configured' : ' · not configured yet'}.
        </p>
      </DmCard>
    </div>
  )
}
