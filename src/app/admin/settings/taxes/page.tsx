import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { SettingsTabs } from '@/components/admin/settings/settings-tabs'

export default async function TaxSettingsPage() {
  const supabase = createClient()

  const { data: taxes } = await supabase
    .from('tax_settings')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <SettingsTabs />
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Tax Settings</h1>
        <Button asChild className="gap-2 bg-[#1e3a5f] hover:bg-[#162d4a]">
          <Link href="/admin/settings/taxes/new">
            <Plus className="w-4 h-4" />
            Add Tax Rate
          </Link>
        </Button>
      </div>

      {taxes && taxes.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Name</th>
                <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Tax Rate</th>
                <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Shipping</th>
                <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {taxes.map((tax: any) => (
                <tr key={tax.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-gray-900">{tax.name}</td>
                  <td className="px-5 py-4 text-gray-700">{tax.tax_rate}%</td>
                  <td className="px-5 py-4 text-gray-700">{tax.apply_to_shipping ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      tax.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tax.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/settings/taxes/${tax.id}`}>
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
          <p className="text-gray-500 mb-4">No tax rates configured yet.</p>
          <Button asChild className="gap-2 bg-[#1e3a5f] hover:bg-[#162d4a]">
            <Link href="/admin/settings/taxes/new">
              <Plus className="w-4 h-4" />
              Add Tax Rate
            </Link>
          </Button>
        </div>
      )}
      </div>
    </div>
  )
}
