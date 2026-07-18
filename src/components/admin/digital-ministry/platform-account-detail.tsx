import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DmCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { DmConnectButton } from '@/components/admin/digital-ministry/dm-connect-button'
import type { DmPlatform } from '@/lib/digital-ministry/types'
import { metaConfigured } from '@/lib/meta/oauth'
import { cn } from '@/lib/utils'

const LABELS: Partial<Record<DmPlatform, string>> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  threads: 'Threads',
  pinterest: 'Pinterest',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  website: 'Website / Blog',
  email: 'Email Newsletter',
  google_business: 'Google Business Profile',
  rss: 'RSS',
}

export async function PlatformAccountDetail({ platform }: { platform: DmPlatform }) {
  const label = LABELS[platform]
  if (!label) notFound()

  const supabase = createClient()
  const { data: rows } = await supabase
    .from('dm_social_accounts')
    .select(
      'id, platform, account_name, account_id, avatar_url, status, health_status, health_message, scopes, token_expires_at, last_synced_at, metadata'
    )
    .eq('platform', platform)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  )
  const metaOk = metaConfigured()
  const primary = rows?.[0]

  return (
    <div className="space-y-6">
      <DmPageHeader
        title={label}
        description={`Connection health, scopes, and sync status for ${label}.`}
        actions={
          <DmConnectButton
            platform={platform}
            status={primary?.status}
            accountId={primary?.account_id}
            metaConfigured={metaOk}
            googleConfigured={googleConfigured}
          />
        }
      />

      {!rows?.length ? (
        <DmCard className="p-6 text-sm text-muted-foreground">
          No {label} account connected yet. Use Connect to authorize via the official API.
        </DmCard>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <DmCard key={row.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  {row.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.avatar_url}
                      alt=""
                      className="size-12 rounded-full border border-border/60 object-cover"
                    />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                      {label.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold tracking-tight">
                      {row.account_name ?? row.account_id ?? 'Account'}
                    </h3>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{row.account_id}</p>
                    {row.health_message ? (
                      <p className="mt-2 text-sm text-muted-foreground">{row.health_message}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      row.status === 'connected'
                        ? 'bg-emerald-50 text-emerald-700'
                        : row.status === 'error'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-800'
                    )}
                  >
                    {row.status}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {row.health_status}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Token expires
                  </dt>
                  <dd className="mt-0.5 tabular-nums">
                    {row.token_expires_at
                      ? new Date(row.token_expires_at).toLocaleString()
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Last synced
                  </dt>
                  <dd className="mt-0.5 tabular-nums">
                    {row.last_synced_at
                      ? new Date(row.last_synced_at).toLocaleString()
                      : '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Scopes
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {(row.scopes ?? []).join(' · ') || '—'}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <DmConnectButton
                  platform={platform}
                  status={row.status}
                  accountId={row.account_id}
                  metaConfigured={metaOk}
                  googleConfigured={googleConfigured}
                />
              </div>
            </DmCard>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        <Link href="/admin/digital-ministry/accounts" className="underline underline-offset-2">
          ← All accounts
        </Link>
      </p>
    </div>
  )
}
