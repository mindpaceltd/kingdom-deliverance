'use server'

import { createClient } from '@/lib/supabase/server'
import { initiateFlutterwavePayment } from '@/lib/payments/flutterwave'

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
}) {
  const supabase = createClient()
  
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

  // 3. Initiate Flutterwave
  const tx_ref = `KDC-${order.id.split('-')[0]}-${Date.now()}`
  
  const flwResponse = await initiateFlutterwavePayment({
    amount: data.subtotal,
    currency: data.currency,
    email: data.email,
    name: data.name,
    tx_ref,
    redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/verify`
  })

  if (flwResponse.status === 'success') {
    // 4. Create Pending Transaction record
    await supabase.from('transactions').insert({
      order_id: order.id,
      gateway: 'flutterwave',
      reference: tx_ref,
      amount: data.subtotal,
      currency: data.currency,
      status: 'pending'
    })

    return { success: true, paymentUrl: flwResponse.data.link }
  } else {
    return { error: 'Failed to initiate payment. Please try again.' }
  }
}
