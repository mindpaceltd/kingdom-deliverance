import { createClient } from '@/lib/supabase/server'
import { verifyFlutterwavePayment } from '@/lib/payments/flutterwave'
import { getPesapalAuthToken, getPesapalTransactionStatus } from '@/lib/payments/pesapal'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const gateway = searchParams.get('gateway') || 'pesapal'
  
  const supabase = createClient()
  let orderId = null

  if (gateway === 'flutterwave') {
    const status = searchParams.get('status')
    const tx_ref = searchParams.get('tx_ref')
    const transaction_id = searchParams.get('transaction_id')

    if (status === 'successful' && transaction_id) {
      const verification = await verifyFlutterwavePayment(transaction_id)
      if (verification.status === 'success' && verification.data.status === 'successful') {
        const { data: tx } = await supabase
          .from('transactions')
          .update({ status: 'successful', raw_response: verification.data })
          .eq('reference', tx_ref)
          .select().single()
        
        if (tx) orderId = tx.order_id
      }
    }
  } else if (gateway === 'pesapal') {
    const orderTrackingId = searchParams.get('OrderTrackingId')
    const orderMerchantReference = searchParams.get('OrderMerchantReference')

    if (orderTrackingId) {
      const token = await getPesapalAuthToken()
      const verification = await getPesapalTransactionStatus(orderTrackingId, token)

      if (verification.status_code === 1) { // 1 = Completed/Success in Pesapal
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
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'processing' })
      .eq('id', orderId)
    
    redirect(`/checkout/success?order_id=${orderId}`)
  }

  redirect('/checkout/error')
}
