import { createAdminClient } from '@/lib/supabase/server'
import { getPesapalAuthToken, getPesapalTransactionStatus } from '@/lib/payments/pesapal'
import { finalizeOrder } from '@/lib/orders/finalize'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const gateway = searchParams.get('gateway') || 'pesapal'
  
  // Use admin client since session cookies are lost after payment redirect
  const supabase = createAdminClient()
  let orderId: string | null = null

  if (gateway === 'pesapal') {
    const orderTrackingId = searchParams.get('OrderTrackingId')

    if (orderTrackingId) {
      const token = await getPesapalAuthToken()
      const verification = await getPesapalTransactionStatus(orderTrackingId, token)

      if (verification.status_code === 1 || verification.status_code === '1') {
        const { data: tx } = await supabase
          .from('transactions')
          .update({ 
            status: 'successful', 
            raw_response: verification 
          })
          .eq('reference', orderTrackingId)
          .select().single()

        if (tx) orderId = tx.order_id
      }
    }
  }

  if (orderId) {
    // Finalize: update status, generate download tokens, send email
    await finalizeOrder(orderId)
    redirect(`/checkout/success?order_id=${orderId}`)
  }

  redirect('/checkout/error')
}
