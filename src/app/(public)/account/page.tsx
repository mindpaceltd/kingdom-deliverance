import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package, Download, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AccountDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/account/login')
  }

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total_amount, currency, created_at')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: downloads } = await supabase
    .from('download_tokens')
    .select('id, token, product:products(name), download_count, max_downloads, expires_at')
    .eq('email', user.email!)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-900">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#1e3a5f]" /> Recent Orders
            </h3>
            <Link href="/account/orders" className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-0.5">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">#{order.order_number || order.id.split('-')[0]}</p>
                    <p className="text-[11px] text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No orders yet.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-[#1e3a5f]" /> My Downloads
            </h3>
            <Link href="/account/downloads" className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-0.5">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {downloads && downloads.length > 0 ? (
            <div className="space-y-2">
              {downloads.map((dl: any) => (
                <div key={dl.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900 truncate">{dl.product?.name}</p>
                  <a
                    href={`/api/downloads/${dl.token}`}
                    className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded font-bold hover:bg-blue-700"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No downloads available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
