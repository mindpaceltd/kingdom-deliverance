import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EyeIcon, PackageIcon, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { OrderActions } from '@/components/admin/orders/order-actions'

export default async function AdminOrdersPage() {
  const supabase = createClient()
  
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage your shop sales and fulfillment.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-primary">Order ID</th>
                <th className="px-6 py-4 font-semibold text-primary">Customer</th>
                <th className="px-6 py-4 font-semibold text-primary">Total</th>
                <th className="px-6 py-4 font-semibold text-primary">Payment Status</th>
                <th className="px-6 py-4 font-semibold text-primary">Fulfillment</th>
                <th className="px-6 py-4 font-semibold text-primary">Date</th>
                <th className="px-6 py-4 font-semibold text-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders && orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-primary">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-primary">
                          {order.customer_name || order.shipping_address?.name || order.email}
                        </span>
                        <span className="text-xs text-muted-foreground">{order.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-primary font-bold">
                      {order.currency} {order.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={order.payment_status === 'paid' ? 'success' : order.payment_status === 'refunded' ? 'destructive' : 'outline'}>
                        {order.payment_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={order.status === 'processing' ? 'secondary' : 'outline'}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild title="View Details">
                          <Link href={`/admin/orders/${order.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <OrderActions order={order} showLabel={false} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <PackageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
