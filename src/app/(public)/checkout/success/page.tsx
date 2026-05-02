import { createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Download, ShoppingBag, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { ClearCartOnMount } from '@/components/shop/clear-cart-on-mount'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order_id: string }
}) {
  const supabase = createAdminClient()
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        product:products(name, type, file_url)
      )
    `)
    .eq('id', searchParams.order_id)
    .single()

  // Fetch download tokens for this order
  let downloadTokens: any[] = []
  if (order) {
    const { data: tokens } = await supabase
      .from('download_tokens')
      .select('*, product:products(name)')
      .eq('order_id', order.id)

    downloadTokens = tokens || []
  }

  const hasDigital = downloadTokens.length > 0
  const orderNumber = order?.order_number || order?.id?.split('-')[0]

  return (
    <div className="pt-32 pb-20 min-h-screen bg-gray-50">
      <ClearCartOnMount />
      <div className="container max-w-2xl px-4 mx-auto">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-3">
            Order Confirmed!
          </h1>
          <p className="text-gray-500 text-sm mb-1">
            Thank you for your purchase. Order <span className="font-bold text-gray-900">#{orderNumber}</span>
          </p>
          <p className="text-gray-400 text-xs mb-8">
            A confirmation email has been sent to <span className="font-medium">{order?.email}</span>
          </p>

          {/* Digital Downloads */}
          {hasDigital && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-base font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Download className="w-5 h-5" /> Your Downloads
              </h3>
              <p className="text-xs text-blue-700 mb-4">
                Links expire in 7 days. Max 5 downloads each.
              </p>
              <div className="space-y-2">
                {downloadTokens.map((dt: any) => (
                  <div key={dt.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-200">
                    <span className="font-semibold text-sm text-blue-900">{dt.product?.name}</span>
                    <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-xs">
                      <a href={`/api/downloads/${dt.token}`}>Download</a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Account Prompt */}
          {!order?.user_id && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 text-left">
              <div className="flex items-start gap-3">
                <UserPlus className="w-5 h-5 text-amber-700 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-amber-900">Create an account?</p>
                  <p className="text-xs text-amber-700 mt-0.5 mb-3">Track your orders, access downloads anytime, and get faster checkout.</p>
                  <Button size="sm" variant="outline" asChild className="border-amber-300 text-amber-900 hover:bg-amber-100">
                    <Link href="/account/login">Create Account</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/shop">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
            {order?.user_id ? (
              <Button asChild className="rounded-xl bg-[#1e3a5f] hover:bg-[#162d4a]">
                <Link href="/account/orders">
                  View Order History
                </Link>
              </Button>
            ) : (
              <Button asChild className="rounded-xl bg-[#1e3a5f] hover:bg-[#162d4a]">
                <Link href="/account/guest">
                  Lookup Your Order
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
