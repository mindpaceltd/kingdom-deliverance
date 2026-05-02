import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit2, Trash2, Truck } from 'lucide-react'
import { SettingsTabs } from '@/components/admin/settings/settings-tabs'

export default async function ShippingSettingsPage() {
  const supabase = createClient()

  const { data: shippingRates } = await supabase
    .from('shipping_settings')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <SettingsTabs />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Shipping Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Configure shipping rates and zones for physical products.</p>
          </div>
          <Button asChild className="gap-2 bg-[#1e3a5f] hover:bg-[#162d4a]">
            <Link href="/admin/settings/shipping/new">
              <Plus className="w-4 h-4" />
              Add Shipping Rate
            </Link>
          </Button>
        </div>

        {shippingRates && shippingRates.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Name</th>
                  <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Rate (USD)</th>
                  <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Countries</th>
                  <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shippingRates.map((rate: any) => (
                  <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">{rate.name}</td>
                    <td className="px-5 py-4 text-gray-700">${rate.rate_usd}</td>
                    <td className="px-5 py-4 text-gray-700">
                      {rate.countries?.length > 0 ? `${rate.countries.length} countries` : 'All countries'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        rate.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {rate.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/settings/shipping/${rate.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No shipping rates configured yet.</p>
            <p className="text-sm text-gray-400 mb-6">Set up shipping rates for different countries and regions.</p>
            <Button asChild className="gap-2 bg-[#1e3a5f] hover:bg-[#162d4a]">
              <Link href="/admin/settings/shipping/new">
                <Plus className="w-4 h-4" />
                Add Shipping Rate
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}