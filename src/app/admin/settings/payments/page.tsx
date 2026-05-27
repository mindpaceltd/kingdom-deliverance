import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Edit2, CheckCircle2, AlertCircle } from 'lucide-react'
import { PaymentGatewayToggle } from '@/components/admin/settings/payment-gateway-toggle'
import {
  getPaymentGatewaysForAdmin,
  getPaymentGatewayCredentialStatus,
} from '@/lib/payments/ensure-payment-gateways'

export default async function PaymentSettingsPage() {
  const admin = createAdminClient()

  const [{ data: gateways, setupError }, credentialStatus] = await Promise.all([
    getPaymentGatewaysForAdmin(admin),
    getPaymentGatewayCredentialStatus(admin),
  ])

  const statusByName = Object.fromEntries(
    credentialStatus.map((s) => [s.gateway_name, s])
  )

  const usingFallback = gateways.some((g) => g.id.startsWith('fallback-'))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Systems</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enable gateways for checkout. API keys live under{' '}
            <Link href="/admin/settings" className="font-medium text-accent underline">
              General → Payments
            </Link>
            .
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/settings">Edit API credentials</Link>
        </Button>
      </div>

      {setupError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Database sync needed</p>
          <p className="mt-1 text-xs">
            Your Pesapal keys are saved in settings, but the payment gateways table needs a
            migration. Showing connected gateways from your saved credentials below.
          </p>
        </div>
      )}

      {gateways.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {gateways.map((gateway) => {
            const cred = statusByName[gateway.gateway_name]
            const configured = cred?.credentialsConfigured ?? false
            const isFallback = gateway.id.startsWith('fallback-')

            return (
              <div
                key={gateway.id}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{gateway.display_name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{gateway.description}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {gateway.gateway_name}
                      {cred?.enabledInSettings ? ' · enabled in General settings' : ''}
                    </p>
                  </div>
                  {!isFallback && (
                    <PaymentGatewayToggle id={gateway.id} isActive={gateway.is_active} />
                  )}
                  {isFallback && (
                    <span
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                        gateway.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {gateway.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {configured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                      <CheckCircle2 className="size-3" />
                      Credentials configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                      <AlertCircle className="size-3" />
                      Add keys in General → Payments
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      gateway.test_mode
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {gateway.test_mode ? 'Test / Sandbox' : 'Live'}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {isFallback ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/admin/settings">Manage in General settings</Link>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/settings/payments/${gateway.id}`}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Configure
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <p className="text-muted-foreground">No payment systems found.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Enable Pesapal under General → Payments and save your Consumer Key &amp; Secret.
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/admin/settings">Set up Pesapal in General settings</Link>
          </Button>
        </div>
      )}

      {usingFallback && (
        <p className="text-xs text-muted-foreground">
          Gateways are read from General settings until the database sync completes. Save
          payment settings once, or use{' '}
          <Link href="/admin/settings" className="underline">
            General → Payments
          </Link>{' '}
          to enable or disable Pesapal.
        </p>
      )}
    </div>
  )
}
