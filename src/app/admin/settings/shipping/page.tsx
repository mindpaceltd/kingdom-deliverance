import { createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit2, Truck } from 'lucide-react'
import { SettingsRowDelete } from '@/components/admin/settings/settings-row-delete'
import { deleteShippingRate } from '@/lib/actions/settings-shop'

export default async function ShippingSettingsPage() {
  const admin = createAdminClient()
  const { data: shippingRates } = await admin
    .from('shipping_settings')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipping Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure shipping rates and zones for physical products.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/settings/shipping/new">
            <Plus className="w-4 h-4" />
            Add Shipping Rate
          </Link>
        </Button>
      </div>

      {shippingRates && shippingRates.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Rate (USD)
                </th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Countries
                </th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shippingRates.map((rate) => (
                <tr key={rate.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 font-medium">{rate.name}</td>
                  <td className="px-5 py-4">${rate.rate_usd}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {rate.countries?.length > 0
                      ? `${rate.countries.length} countries`
                      : 'All countries'}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        rate.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {rate.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/settings/shipping/${rate.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </Button>
                      <SettingsRowDelete
                        label={rate.name}
                        onDelete={deleteShippingRate.bind(null, rate.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <Truck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No shipping rates configured yet.</p>
          <Button asChild className="gap-2">
            <Link href="/admin/settings/shipping/new">
              <Plus className="w-4 h-4" />
              Add Shipping Rate
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
