'use server'

import { createClient } from '@/lib/supabase/server'
import { initiateFlutterwavePayment } from '@/lib/payments/flutterwave'
import { getPesapalAuthToken, initiatePesapalPayment } from '@/lib/payments/pesapal'

export async function createOrder(data: {
  email: string
  name: string
  phone: string
  address: string
  city: string
  country: string
  items: any[]
  subtotal: number
  currency: string
  gateway?: 'flutterwave' | 'pesapal'
}) {
  const supabase = createClient()
  const gateway = data.gateway || 'pesapal' // Default to Pesapal as per user request
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. Create Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user?.id || null,
      email: data.email,
      total_amount: data.subtotal,
      currency: data.currency,
      shipping_address: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country
      },
      status: 'pending',
      payment_status: 'pending'
    })
    .select()
    .single()

  if (orderError) return { error: orderError.message }

  // 2. Create Order Items
  const orderItems = data.items.map(item => ({
    order_id: order.id,
    product_id: item.id,
    quantity: item.quantity,
    price_at_purchase: item.price
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) return { error: itemsError.message }

  const tx_ref = `KDC-${order.id.split('-')[0]}-${Date.now()}`

  // 3. Initiate Payment based on gateway
  if (gateway === 'flutterwave') {
    const flwResponse = await initiateFlutterwavePayment({
      amount: data.subtotal,
      currency: data.currency,
      email: data.email,
      name: data.name,
      tx_ref,
      redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/verify?gateway=flutterwave`
    })

    if (flwResponse.status === 'success') {
      await supabase.from('transactions').insert({
        order_id: order.id,
        gateway: 'flutterwave',
        reference: tx_ref,
        amount: data.subtotal,
        currency: data.currency,
        status: 'pending'
      })
      return { success: true, paymentUrl: flwResponse.data.link }
    }
  } else if (gateway === 'pesapal') {
    try {
      const token = await getPesapalAuthToken()
      const names = data.name.split(' ')
      const firstName = names[0]
      const lastName = names.slice(1).join(' ') || names[0]

      const psaResponse = await initiatePesapalPayment({
        id: tx_ref,
        amount: data.subtotal,
        currency: data.currency,
        description: `Order #${order.id.split('-')[0]} from Kingdom Deliverance Store`,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/verify?gateway=pesapal`,
        notification_id: process.env.PESAPAL_IPN_ID!, // User must provide this
        billing_address: {
          email_address: data.email,
          phone_number: data.phone,
          first_name: firstName,
          last_name: lastName
        }
      }, token)

      if (psaResponse.status === '200' || psaResponse.order_tracking_id) {
        await supabase.from('transactions').insert({
          order_id: order.id,
          gateway: 'pesapal',
          reference: psaResponse.order_tracking_id, // Pesapal uses tracking ID for verification
          amount: data.subtotal,
          currency: data.currency,
          status: 'pending'
        })
        return { success: true, paymentUrl: psaResponse.redirect_url }
      } else {
        console.error('Pesapal Error:', psaResponse)
        return { error: psaResponse.message || 'Pesapal initiation failed' }
      }
    } catch (err: any) {
      console.error('Pesapal Exception:', err)
      return { error: 'Failed to connect to Pesapal' }
    }
  }

  return { error: 'Payment initiation failed. Please try again.' }
}
