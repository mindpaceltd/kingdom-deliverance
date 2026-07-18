import { createClient } from '@/lib/supabase/server'
import { QrCodesAdminClient } from '@/components/admin/qr-codes/qr-codes-admin-client'
import type { Metadata } from 'next'
import type { UserRole } from '@/lib/types'

export const metadata: Metadata = {
  title: 'QR Codes | Admin',
}

export default async function AdminQrCodesPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Not authenticated.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role as UserRole) !== 'admin') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold text-destructive">Not Authorised</h1>
        <p className="text-sm text-muted-foreground mt-1">
          You do not have permission to manage QR codes.
        </p>
      </div>
    )
  }

  const { data: rows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['qr_codes_json'])

  const map: Record<string, string> = {}
  for (const row of rows ?? []) {
    if (row.value) map[row.key] = row.value
  }

  let initialQrCodes: Array<{
    id: string
    title: string
    subtitle: string
    value: string
    color: string
  }> = []

  try {
    if (map.qr_codes_json) {
      initialQrCodes = JSON.parse(map.qr_codes_json)
    }
  } catch {
    initialQrCodes = []
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden -m-3 sm:-m-4 lg:-m-6 bg-background">
      <header className="shrink-0 border-b border-border bg-background/95 px-3 py-4 sm:px-6 backdrop-blur">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">QR Codes</h1>
          <p className="text-xs text-muted-foreground">
            Create and manage QR codes for donations, mobile money, and more.
            They will be displayed on the public{' '}
            <a href="/give" target="_blank" className="text-primary underline underline-offset-2">
              /give
            </a>{' '}
            page.
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <QrCodesAdminClient initialQrCodes={initialQrCodes} />
        </div>
      </main>
    </div>
  )
}
