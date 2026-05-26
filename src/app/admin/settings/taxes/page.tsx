import { createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit2 } from 'lucide-react'
import { SettingsRowDelete } from '@/components/admin/settings/settings-row-delete'
import { deleteTaxRate } from '@/lib/actions/settings-shop'

export default async function TaxSettingsPage() {
  const admin = createAdminClient()
  const { data: taxes } = await admin
    .from('tax_settings')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tax Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">VAT and sales tax rates by region.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/settings/taxes/new">
            <Plus className="w-4 h-4" />
            Add Tax Rate
          </Link>
        </Button>
      </div>

      {taxes && taxes.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Tax Rate
                </th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Shipping
                </th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {taxes.map((tax) => (
                <tr key={tax.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 font-medium">{tax.name}</td>
                  <td className="px-5 py-4">{tax.tax_rate}%</td>
                  <td className="px-5 py-4">{tax.apply_to_shipping ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        tax.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tax.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/settings/taxes/${tax.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </Button>
                      <SettingsRowDelete
                        label={tax.name}
                        onDelete={deleteTaxRate.bind(null, tax.id)}
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
          <p className="text-muted-foreground mb-4">No tax rates configured yet.</p>
          <Button asChild className="gap-2">
            <Link href="/admin/settings/taxes/new">
              <Plus className="w-4 h-4" />
              Add Tax Rate
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
