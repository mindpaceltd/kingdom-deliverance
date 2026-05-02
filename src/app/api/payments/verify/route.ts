import { createClient } from '@/lib/supabase/server'
import { verifyFlutterwavePayment } from '@/lib/payments/flutterwave'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const tx_ref = searchParams.get('tx_ref')
  const transaction_id = searchParams.get('transaction_id')

  if (status === 'successful' && transaction_id) {
    const supabase = createClient()
    
    // Verify with Flutterwave API
    const verification = await verifyFlutterwavePayment(transaction_id)
    
    if (verification.status === 'success' && verification.data.status === 'successful') {
      // 1. Update Transaction
      const { data: tx } = await supabase
        .from('transactions')
        .update({ 
          status: 'successful',
          raw_response: verification.data
        })
        .eq('reference', tx_ref)
        .select()
        .single()

      if (tx) {
        // 2. Update Order
        await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            status: 'processing'
          })
          .eq('id', tx.order_id)
      }

      // 3. Success Redirect
      redirect(`/checkout/success?order_id=${tx?.order_id}`)
    }
  }

  // Failure Redirect
  redirect('/checkout/error')
}
