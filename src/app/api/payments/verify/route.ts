import { createAdminClient } from '@/lib/supabase/server'
import { getPesapalAuthToken, getPesapalTransactionStatus } from '@/lib/payments/pesapal'
import { getPesapalSettings } from '@/lib/payments/pesapal-settings'
import { capturePayPalPayment, getPayPalOrderDetails } from '@/lib/payments/paypal'
import { finalizeOrder } from '@/lib/orders/finalize'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const gateway = searchParams.get('gateway') || 'pesapal'
  const type = searchParams.get('type') || 'order'
  
  // Use admin client since session cookies are lost after payment redirect
  const supabase = createAdminClient()
  let redirectUrl: string

  if (gateway === 'pesapal') {
    const orderTrackingId = searchParams.get('OrderTrackingId')

    if (orderTrackingId) {
      const settings = await getPesapalSettings()
      const token = await getPesapalAuthToken(settings.consumerKey, settings.consumerSecret, settings.mode)
      const verification = await getPesapalTransactionStatus(orderTrackingId, token, settings.mode)

      if (verification.status_code === 1 || verification.status_code === '1') {
        if (type === 'donation') {
          // Handle donation payment
          const { data: tx } = await supabase
            .from('donation_transactions')
            .update({ 
              status: 'success', 
              raw_response: verification 
            })
            .eq('reference', orderTrackingId)
            .select().single()

          if (tx) {
            // Update donation status
            await supabase
              .from('donations')
              .update({ status: 'confirmed' })
              .eq('id', tx.donation_id)
            
            redirectUrl = `/donations/success?donation_id=${tx.donation_id}`
          } else {
            redirectUrl = '/donations/error'
          }
        } else if (type === 'credits') {
          // Handle credit purchase
          const { data: tx } = await supabase
            .from('credit_transactions')
            .update({ 
              status: 'success', 
              raw_response: verification 
            })
            .eq('reference_id', orderTrackingId)
            .select().single()

          if (tx) {
            // Upsert the user balance
            const { data: currentBalance } = await supabase
              .from('user_credits')
              .select('balance')
              .eq('email', tx.email)
              .maybeSingle()

            const newBalance = (currentBalance?.balance || 0) + tx.amount

            await supabase
              .from('user_credits')
              .upsert({ 
                email: tx.email, 
                balance: newBalance,
                updated_at: new Date().toISOString()
              }, { onConflict: 'email' })
            
            redirectUrl = `/fire-service?purchase=success&credits=${tx.amount}`
          } else {
            redirectUrl = '/fire-service?purchase=error'
          }
        } else {
          // Handle order payment
          const { data: tx } = await supabase
            .from('transactions')
            .update({ 
              status: 'success', 
              raw_response: verification 
            })
            .eq('reference', orderTrackingId)
            .select().single()

          if (tx) {
            // Finalize: update order status, generate download tokens, send email
            await finalizeOrder(tx.order_id)
            redirectUrl = `/checkout/success?order_id=${tx.order_id}`
          } else {
            redirectUrl = '/checkout/error'
          }
        }
      } else {
        redirectUrl = type === 'donation' ? '/donations/error' : '/checkout/error'
      }
    } else {
      redirectUrl = type === 'donation' ? '/donations/error' : '/checkout/error'
    }
  } else if (gateway === 'paypal') {
    const paypalOrderId = searchParams.get('token')

    if (paypalOrderId) {
      // First check if the order was approved
      const orderDetails = await getPayPalOrderDetails(paypalOrderId)

      if (orderDetails.success && orderDetails.order.status === 'APPROVED') {
        // Capture the payment
        const captureResult = await capturePayPalPayment(paypalOrderId)

        if (captureResult.success) {
          if (type === 'donation') {
            // Handle donation payment
            const { data: tx } = await supabase
              .from('donation_transactions')
              .update({
                status: 'success',
                raw_response: captureResult
              })
              .eq('reference', paypalOrderId)
              .select().single()

            if (tx) {
              await supabase
                .from('donations')
                .update({ status: 'confirmed' })
                .eq('id', tx.donation_id)
              
              redirectUrl = `/donations/success?donation_id=${tx.donation_id}`
            } else {
              redirectUrl = '/donations/error'
            }
          } else {
            // Handle order payment
            const { data: tx } = await supabase
              .from('transactions')
              .update({
                status: 'success',
                raw_response: captureResult
              })
              .eq('reference', paypalOrderId)
              .select().single()

            if (tx) {
              // Finalize: update order status, generate download tokens, send email
              await finalizeOrder(tx.order_id)
              redirectUrl = `/checkout/success?order_id=${tx.order_id}`
            } else {
              redirectUrl = '/checkout/error'
            }
          }
        } else {
          redirectUrl = type === 'donation' ? '/donations/error' : '/checkout/error'
        }
      } else {
        redirectUrl = type === 'donation' ? '/donations/error' : '/checkout/error'
      }
    } else {
      redirectUrl = type === 'donation' ? '/donations/error' : '/checkout/error'
    }
  } else {
    redirectUrl = type === 'donation' ? '/donations/error' : '/checkout/error'
  }

  redirect(redirectUrl)
}
