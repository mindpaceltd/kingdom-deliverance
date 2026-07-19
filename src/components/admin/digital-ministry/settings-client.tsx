'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { setDmSetting } from '@/lib/digital-ministry/ops'
import { DM_AI_TONES, type DmAiTone } from '@/lib/digital-ministry/types'
import { cn } from '@/lib/utils'
import {
  ArrowUpRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  ShieldAlert,
  Sparkles,
  Workflow,
} from 'lucide-react'

type Health = {
  google: boolean
  meta: boolean
  gemini: boolean
  tokenEncryption: boolean
} | null

const INTEGRATIONS: Array<{
  key: keyof NonNullable<Health>
  label: string
  hint: string
  env: string
  href?: string
  hrefLabel?: string
}> = [
  {
    key: 'google',
    label: 'Google OAuth',
    hint: 'YouTube connect & Google Analytics setup',
    env: 'GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET',
    href: '/admin/analytics',
    hrefLabel: 'Analytics setup',
  },
  {
    key: 'meta',
    label: 'Meta OAuth',
    hint: 'Facebook & Instagram publishing',
    env: 'META_APP_ID + META_APP_SECRET',
    href: '/admin/digital-ministry/accounts',
    hrefLabel: 'Social accounts',
  },
  {
    key: 'gemini',
    label: 'Gemini AI',
    hint: 'Studio rewrite, Coach, Community drafts, SEO tips',
    env: 'GEMINI_API_KEY',
  },
  {
    key: 'tokenEncryption',
    label: 'Token encryption',
    hint: 'Protects stored OAuth tokens at rest',
    env: 'DM_TOKEN_ENCRYPTION_KEY (or service role)',
  },
]

const MODULE_LINKS = [
  { href: '/admin/digital-ministry/accounts', label: 'Social Accounts', hint: 'Connect platforms' },
  { href: '/admin/digital-ministry/studio', label: 'Content Studio', hint: 'Drafts & publish' },
  { href: '/admin/digital-ministry/growth-coach', label: 'Growth Coach', hint: 'Score & tasks' },
  { href: '/admin/digital-ministry/community', label: 'Community', hint: 'Pastoral inbox' },
  { href: '/admin/digital-ministry/seo', label: 'SEO Center', hint: 'Page audits' },
  { href: '/admin/digital-ministry/reports', label: 'Reports', hint: 'CSV snapshots' },
] as const

export function SettingsClient({
  health,
  notifyEmail,
  defaultTone,
}: {
  health: Health
  notifyEmail: string
  defaultTone: DmAiTone
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState(notifyEmail)
  const [tone, setTone] = useState<DmAiTone>(defaultTone)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function save(action: () => Promise<{ error?: string } | { success: true }>, okMsg: string) {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      try {
        const r = await action()
        if ('error' in r && r.error) setError(r.error)
        else {
          setMessage(okMsg)
          router.refresh()
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      {(error || message) && (
        <p
          className={cn(
            'rounded-xl border px-4 py-2.5 text-sm',
            error
              ? 'border-destructive/30 bg-destructive/5 text-destructive'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          )}
        >
          {error ?? message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Connection health</h2>
            <p className="text-xs text-muted-foreground">
              Environment keys on the server — status only, never displayed as secrets.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {INTEGRATIONS.map((item) => {
              const ok = Boolean(health?.[item.key])
              return (
                <DmCard key={item.key} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-xl',
                          ok ? 'bg-emerald-50' : 'bg-amber-50'
                        )}
                      >
                        {ok ? (
                          <CheckCircle2 className="size-4 text-emerald-700" />
                        ) : (
                          <KeyRound className="size-4 text-amber-700" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        ok
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-amber-200 bg-amber-50 text-amber-900'
                      )}
                    >
                      {ok ? 'Ready' : 'Missing'}
                    </span>
                  </div>
                  <p className="mt-3 rounded-lg bg-muted/40 px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground">
                    {item.env}
                  </p>
                  {item.href ? (
                    <Button asChild size="sm" variant="ghost" className="mt-2 h-8 px-0">
                      <Link href={item.href}>
                        {item.hrefLabel}
                        <ArrowUpRight className="ml-1 size-3.5 opacity-60" />
                      </Link>
                    </Button>
                  ) : null}
                </DmCard>
              )
            })}
          </div>

          <DmCard className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Notification email</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Where Digital Ministry alerts should go (ops / media team).
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="media@kdcuganda.org"
              />
            </div>
            <Button
              size="sm"
              disabled={pending || !email.trim()}
              onClick={() =>
                save(() => setDmSetting('notify_email', { email: email.trim() }), 'Notification email saved')
              }
            >
              {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
              Save email
            </Button>
          </DmCard>

          <DmCard className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Sparkles className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Default AI tone</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Preferred starting tone for Content Studio rewrites (editors can still change per draft).
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DM_AI_TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-[11px] font-semibold capitalize transition-colors',
                    tone === t.id
                      ? 'border-foreground/20 bg-foreground text-background'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                save(
                  () => setDmSetting('studio_prefs', { defaultTone: tone }),
                  'Default AI tone saved'
                )
              }
            >
              {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
              Save tone preference
            </Button>
          </DmCard>

          <div>
            <h2 className="text-sm font-semibold tracking-tight">Module shortcuts</h2>
            <p className="text-xs text-muted-foreground">Jump to the surfaces these settings power.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MODULE_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="group block">
                <DmCard className="flex h-full items-center justify-between gap-3 p-4 transition-colors group-hover:border-foreground/20 group-hover:bg-muted/30">
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-70" />
                </DmCard>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <DmCard className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Workflow className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">Automation</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Growth Coach daily cron:
            </p>
            <code className="block rounded-lg bg-muted/50 px-2.5 py-2 text-[10px] leading-relaxed">
              GET /api/digital-ministry/cron/growth
            </code>
            <p className="text-xs text-muted-foreground">
              Authorize with{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">CRON_SECRET</code> or{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">DM_CRON_SECRET</code>.
            </p>
          </DmCard>

          <DmCard className="space-y-3 border-amber-200/80 bg-amber-50/40 p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-900" />
              <p className="text-sm font-semibold text-amber-950">Secrets</p>
            </div>
            <p className="text-xs leading-relaxed text-amber-950/80">
              API keys live in Vercel / server env only — never commit them to git. Meta can be added when
              Facebook publishing is ready; Gemini should be set for AI features to work in production.
            </p>
          </DmCard>

          <DmCard className="border-dashed p-5 text-xs leading-relaxed text-muted-foreground">
            Preferences save to <code className="text-[10px]">dm_settings</code>. Connection health
            reflects process environment at request time.
          </DmCard>
        </aside>
      </div>
    </div>
  )
}
