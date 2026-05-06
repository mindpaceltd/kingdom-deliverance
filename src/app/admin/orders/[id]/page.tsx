import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2, RotateCcw, Package, User, Mail, Phone, MapPin, Calendar, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { OrderActions } from '@/components/admin/orders/order-actions'

export default async function AdminOrderDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  // Fetch order with items and products
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        price_at_purchase,
        products (
          id,
          name,
          image_url
        )
      ),
      transactions (
        id,
        gateway,
        reference,
        amount,
        currency,
        status,
        created_at
      )
    `)
    .eq('id', params.id)
    .single()

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Order {order.id ? `#${order.id.slice(0, 8)}` : 'Details'}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {order.created_at ? (
                  (() => {
                    try {
                      return format(new Date(order.created_at), 'PPP p')
                    } catch (e) {
                      return 'Invalid date'
                    }
                  })()
                ) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OrderActions order={order} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <Package className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">Order Items</h2>
            </div>
            <div className="divide-y divide-white/5">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {item.products?.image_url ? (
                        <img src={item.products.image_url} alt={item.products.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 opacity-20" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.products?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.currency || 'UGX'} {typeof item.price_at_purchase === 'number' ? item.price_at_purchase.toLocaleString() : (item.price_at_purchase || 0)} × {item.quantity || 0}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {order.currency || 'UGX'} {typeof item.price_at_purchase === 'number' ? (item.price_at_purchase * (item.quantity || 1)).toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-muted/30 flex justify-between items-center border-t border-white/5">
              <span className="font-bold">Total Amount</span>
              <span className="text-xl font-bold text-accent">
                {order.currency || 'UGX'} {typeof order.total_amount === 'number' ? order.total_amount.toLocaleString() : (order.total_amount || 0)}
              </span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">Payment & Transactions</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                  <Badge variant={order.payment_status === 'paid' ? 'success' : order.payment_status === 'refunded' ? 'destructive' : 'outline'}>
                    {order.payment_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fulfillment Status</p>
                  <Badge variant={order.status === 'processing' ? 'secondary' : order.status === 'shipped' ? 'success' : 'outline'}>
                    {order.status}
                  </Badge>
                </div>
              </div>

              {order.transactions && order.transactions.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Gateway</th>
                        <th className="px-4 py-2 font-semibold">Reference</th>
                        <th className="px-4 py-2 font-semibold">Amount</th>
                        <th className="px-4 py-2 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {order.transactions.map((tx: any) => (
                        <tr key={tx.id}>
                          <td className="px-4 py-2 capitalize">{tx.gateway}</td>
                          <td className="px-4 py-2 font-mono text-[10px]">{tx.reference}</td>
                          <td className="px-4 py-2 font-bold">{tx.currency} {tx.amount}</td>
                          <td className="px-4 py-2 text-right">
                            <Badge variant={tx.status === 'success' ? 'success' : 'outline'} className="text-[10px]">
                              {tx.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">Customer Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium leading-none">{order.shipping_address?.name || 'Guest Customer'}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID: {order.user_id && typeof order.user_id === 'string' ? order.user_id.slice(0, 8) : 'GUEST'}</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.email}</span>
                </div>
                {order.shipping_address?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.shipping_address.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">Shipping Address</h2>
            </div>
            <div className="p-6 text-sm space-y-1 text-muted-foreground">
              <p className="text-primary font-medium">{order.shipping_address?.name}</p>
              <p>{order.shipping_address?.address}</p>
              <p>{order.shipping_address?.city}, {order.shipping_address?.country}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
