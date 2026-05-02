import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Toggle } from '@/components/ui/toggle'
import { Edit2 } from 'lucide-react'
import { SettingsTabs } from '@/components/admin/settings/settings-tabs'

export default async function PaymentSettingsPage() {
  const supabase = createClient()

  const { data: gateways } = await supabase
    .from('payment_gateways')
    .select('*')
    .order('display_order', { ascending: true })

  async function toggleGateway(id: string, currentStatus: boolean) {
    'use server'
    const supabase = createClient()
    await supabase
      .from('payment_gateways')
      .update({ is_active: !currentStatus })
      .eq('id', id)
  }

  return (
    <div>
      <SettingsTabs />
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Payment Systems</h1>
        <p className="text-sm text-gray-500 mt-1">Enable or disable payment gateways for checkout.</p>
      </div>

      {gateways && gateways.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((gateway: any) => (
            <div key={gateway.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{gateway.display_name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{gateway.description}</p>
                </div>
                <form action={async () => {
                  'use server'
                  const supabase = createClient()
                  await supabase
                    .from('payment_gateways')
                    .update({ is_active: !gateway.is_active })
                    .eq('id', gateway.id)
                }}>
                  <button type="submit" className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    gateway.is_active 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                    {gateway.is_active ? 'Active' : 'Inactive'}
                  </button>
                </form>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  gateway.test_mode ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}>
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
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <p className="text-gray-500">No payment systems found.</p>
        </div>
      )}
      </div>
    </div>
  )
}
