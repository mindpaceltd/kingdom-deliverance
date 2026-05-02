import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Download } from 'lucide-react'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*, product:products(name, type, image_url, slug))
    `)
    .eq('id', params.id)
    .single()

  if (!order || (order.user_id !== user!.id && order.email !== user!.email)) {
    notFound()
  }

  // Fetch download tokens
  const { data: tokens } = await supabase
    .from('download_tokens')
    .select('*, product:products(name)')
    .eq('order_id', order.id)
    .eq('email', user!.email!)

  const orderNumber = order.order_number || order.id.split('-')[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="text-gray-400 hover:text-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Order #{orderNumber}</h1>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
          order.status === 'completed' ? 'bg-green-100 text-green-700' :
          order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Date</p>
          <p className="text-sm font-semibold text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total</p>
          <p className="text-sm font-semibold text-gray-900">{order.currency} {Number(order.total_amount).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Payment</p>
          <p className="text-sm font-semibold text-gray-900 capitalize">{order.payment_status}</p>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-900">Items</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {order.order_items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              {item.product?.image_url && (
                <img src={item.product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{item.product?.name}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity} · ${Number(item.price_at_purchase).toFixed(2)} each</p>
              </div>
              <p className="font-bold text-sm text-gray-900">
                ${(item.price_at_purchase * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Downloads */}
      {tokens && tokens.length > 0 && (
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
          <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2 mb-3">
            <Download className="w-4 h-4" /> Downloads
          </h3>
          <div className="space-y-2">
            {tokens.map((dt: any) => {
              const expired = new Date(dt.expires_at) < new Date()
              const limitReached = dt.download_count >= dt.max_downloads
              return (
                <div key={dt.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-200">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{dt.product?.name}</p>
                    <p className="text-[11px] text-gray-400">{dt.download_count}/{dt.max_downloads} downloads used</p>
                  </div>
                  {expired || limitReached ? (
                    <span className="text-xs text-red-500 font-medium">
                      {expired ? 'Expired' : 'Limit reached'}
                    </span>
                  ) : (
                    <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-xs">
                      <a href={`/api/downloads/${dt.token}`}>Download</a>
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Shipping Address */}
      {order.shipping_address && order.shipping_address.address && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-sm text-gray-900 mb-2">Shipping Address</h3>
          <p className="text-sm text-gray-600">
            {order.shipping_address.name}<br />
            {order.shipping_address.address}<br />
            {order.shipping_address.city}, {order.shipping_address.country}<br />
            {order.shipping_address.phone}
          </p>
        </div>
      )}
    </div>
  )
}
