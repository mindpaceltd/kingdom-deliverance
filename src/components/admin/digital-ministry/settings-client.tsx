'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { setDmSetting } from '@/lib/digital-ministry/ops'
import { Loader2 } from 'lucide-react'

export function SettingsClient({
  health,
  notifyEmail,
}: {
  health: {
    google: boolean
    meta: boolean
    gemini: boolean
    tokenEncryption: boolean
  } | null
  notifyEmail: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState(notifyEmail)
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <DmCard className="p-5">
        <p className="text-sm font-semibold">API connection health</p>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            ['Google OAuth', health?.google],
            ['Meta OAuth', health?.meta],
            ['Gemini AI', health?.gemini],
            ['Token encryption', health?.tokenEncryption],
          ].map(([label, ok]) => (
            <li key={String(label)} className="flex justify-between gap-3">
              <span>{label}</span>
              <span className={ok ? 'text-emerald-700' : 'text-amber-700'}>
                {ok ? 'configured' : 'missing'}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/digital-ministry/accounts">Social Accounts</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/analytics">Google Analytics</Link>
          </Button>
        </div>
      </DmCard>

      <DmCard className="space-y-3 p-5">
        <p className="text-sm font-semibold">Notification email (stored in dm_settings)</p>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="media@kdcuganda.org"
        />
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await setDmSetting('notify_email', { email })
              setMessage(r.error ? r.error : 'Saved')
              router.refresh()
            })
          }
        >
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
          Save
        </Button>
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
        <p className="text-[11px] text-muted-foreground">
          Meta env vars can be added at the end of the rollout. Cron:{' '}
          <code>/api/digital-ministry/cron/growth</code>
        </p>
      </DmCard>
    </div>
  )
}
