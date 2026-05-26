import { createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit2 } from 'lucide-react'
import { PaymentGatewayToggle } from '@/components/admin/settings/payment-gateway-toggle'

export default async function PaymentSettingsPage() {
  const admin = createAdminClient()
  const { data: gateways } = await admin
    .from('payment_gateways')
    .select('*')
    .order('display_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Systems</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enable or disable payment gateways for checkout. API credentials are configured under
          General → Payments.
        </p>
      </div>

      {gateways && gateways.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((gateway) => (
            <div
              key={gateway.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{gateway.display_name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{gateway.description}</p>
                </div>
                <PaymentGatewayToggle id={gateway.id} isActive={gateway.is_active} />
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    gateway.test_mode
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {gateway.test_mode ? 'Test Mode' : 'Live Mode'}
                </span>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/settings/payments/${gateway.id}`}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Configure
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <p className="text-muted-foreground">No payment systems found.</p>
        </div>
      )}
    </div>
  )
}
