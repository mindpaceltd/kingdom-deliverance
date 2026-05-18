import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/account/login')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total_amount, currency, created_at')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-900">My Orders</h1>

      {orders && orders.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Order</th>
                <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-right px-5 py-3 font-bold text-gray-600 text-xs uppercase">Total</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-bold text-gray-900">
                    #{order.order_number || order.id.split('-')[0]}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      order.payment_status === 'paid' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-gray-900">
                    {order.currency} {Number(order.total_amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-xs text-[#1e3a5f] hover:underline font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700 mb-1">No orders yet</h3>
          <p className="text-sm text-gray-400 mb-4">Your order history will appear here.</p>
          <Link href="/shop" className="text-sm text-[#1e3a5f] font-bold hover:underline">
            Browse Shop →
          </Link>
        </div>
      )}
    </div>
  )
}
