import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ShoppingBag, Download } from 'lucide-react'
import Link from 'next/link'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order_id: string }
}) {
  const supabase = createClient()
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        product:products(*)
      )
    `)
    .eq('id', searchParams.order_id)
    .single()

  const hasDigital = order?.order_items.some(item => item.product.type === 'digital')

  return (
    <div className="pt-48 pb-32 min-h-screen bg-white">
      <div className="container max-w-2xl px-4 text-center">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-6">
          Order Confirmed!
        </h1>
        <p className="text-primary/70 text-lg mb-10">
          Thank you for your purchase. Your order <span className="font-bold">#{order?.id.split('-')[0]}</span> has been received and is being processed.
        </p>

        {hasDigital && (
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 mb-10 text-left">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" /> Digital Delivery
            </h3>
            <p className="text-blue-800/70 text-sm mb-6">
              Your digital downloads are ready! We've also sent the links to <span className="font-bold">{order?.email}</span>.
            </p>
            <div className="space-y-3">
              {order?.order_items
                .filter(i => i.product.type === 'digital')
                .map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                    <span className="font-bold text-blue-900">{item.product.name}</span>
                    <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
                      <a href={item.product.file_url} target="_blank">Download</a>
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild variant="outline" className="h-14 px-8 rounded-2xl">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
          <Button asChild className="h-14 px-8 rounded-2xl gap-2 shadow-xl shadow-primary/20">
            <Link href="/admin/profile">
              View Order History
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
