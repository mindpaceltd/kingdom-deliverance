import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getPesapalAuthToken, getPesapalTransactionStatus } from '@/lib/payments/pesapal'

export const dynamic = 'force-dynamic'

/**
 * PesaPal IPN (Instant Payment Notification) Listener
 * 
 * Webhook endpoint that PesaPal calls to notify payment status changes.
 * Registered at: https://kdcuganda.org/api/payments/pesapal-ipn
 * 
 * PesaPal sends GET requests with OrderTrackingId parameter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderTrackingId = searchParams.get('OrderTrackingId')
    const notification_id = searchParams.get('notification_id')

    // Validate required parameters
    if (!orderTrackingId) {
      console.error('[PesaPal IPN] Missing OrderTrackingId')
      return NextResponse.json(
        { error: 'Missing OrderTrackingId' },
        { status: 400 }
      )
    }

    // Get auth token for PesaPal API
    const token = await getPesapalAuthToken()

    // Verify transaction status with PesaPal
    const verification = await getPesapalTransactionStatus(orderTrackingId, token)

    const supabase = createAdminClient()
    const isPaid = verification.status_code === 1 || verification.status_code === '1'

    // Try to find the transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', orderTrackingId)
      .single()

    if (transaction) {
      // Update transaction with PesaPal response
      await supabase
        .from('transactions')
        .update({
          status: isPaid ? 'success' : 'failed',
          raw_response: verification,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      // If payment successful and order_id exists, finalize the order
      if (isPaid && transaction.order_id) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            order_status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.order_id)

        console.log(`[PesaPal IPN] Order ${transaction.order_id} payment confirmed`)
      }
    } else {
      // Check if this is a donation transaction
      const { data: donationTx } = await supabase
        .from('donation_transactions')
        .select('*')
        .eq('reference', orderTrackingId)
        .single()

      if (donationTx) {
        await supabase
          .from('donation_transactions')
          .update({
            status: isPaid ? 'success' : 'failed',
            raw_response: verification,
            updated_at: new Date().toISOString()
          })
          .eq('id', donationTx.id)

        if (isPaid && donationTx.donation_id) {
          await supabase
            .from('donations')
            .update({
              status: 'confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('id', donationTx.donation_id)

          console.log(`[PesaPal IPN] Donation ${donationTx.donation_id} payment confirmed`)
        }
      } else {
        console.warn(`[PesaPal IPN] No transaction found for OrderTrackingId: ${orderTrackingId}`)
      }
    }

    // Always return 200 OK to PesaPal to acknowledge receipt
    return NextResponse.json(
      { success: true, orderTrackingId },
      { status: 200 }
    )
  } catch (error) {
    console.error('[PesaPal IPN] Error processing notification:', error)
    // Still return 200 to prevent PesaPal retries, but log the error
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    )
  }
}

/**
 * Handle POST requests (optional, in case PesaPal sends POST instead of GET)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const orderTrackingId = body.OrderTrackingId || body.order_tracking_id

    if (!orderTrackingId) {
      return NextResponse.json(
        { error: 'Missing OrderTrackingId' },
        { status: 400 }
      )
    }

    // Reconstruct as GET request and process
    const url = new URL(request.url)
    url.searchParams.set('OrderTrackingId', orderTrackingId)
    
    const getRequest = new NextRequest(url, { method: 'GET' })
    return GET(getRequest)
  } catch (error) {
    console.error('[PesaPal IPN] Error processing POST:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    )
  }
}
