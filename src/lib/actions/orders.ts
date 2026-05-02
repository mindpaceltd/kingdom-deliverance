'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPesapalAuthToken, initiatePesapalPayment } from '@/lib/payments/pesapal'

export async function createOrder(data: {
  email: string
  name: string
  phone: string
  address?: string
  city?: string
  country?: string
  items: { id: string; name: string; price: number; quantity: number; type: string }[]
  subtotal: number
  shippingMethod?: 'standard' | 'express'
  currency: string
  gateway?: 'pesapal'
}) {
  const supabase = createClient()
  const adminClient = createAdminClient()
  const gateway = data.gateway || 'pesapal'
  
  // Check if user is authenticated (optional for guest checkout)
  const { data: { user } } = await supabase.auth.getUser()
  
  // Server-side price validation: re-fetch products from DB
  const productIds = data.items.map(item => item.id)
  const { data: products } = await adminClient
    .from('products')
    .select('id, price_usd, regular_price_usd, sale_price_usd, is_active')
    .in('id', productIds)

  if (!products || products.length !== productIds.length) {
    return { error: 'Some products are no longer available.' }
  }

  // Recalculate total from DB prices
  let validatedSubtotal = 0
  for (const item of data.items) {
    const product = products.find(p => p.id === item.id)
    if (!product || !product.is_active) {
      return { error: `Product "${item.name}" is no longer available.` }
    }
    const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
    const unitPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)
    validatedSubtotal += unitPrice * item.quantity
  }

  // Apply currency conversion
  const RATES: Record<string, number> = {
    USD: 1, UGX: 3800, KES: 130, RWF: 1250, GBP: 0.8
  }
  const SHIPPING_RATES_USD: Record<string, number> = {
    standard: 5,
    express: 12,
  }
  const rate = RATES[data.currency] || 1
  const hasPhysicalItems = data.items.some((item) => item.type !== 'digital')
  const shippingMethod = hasPhysicalItems ? data.shippingMethod || 'standard' : undefined
  const shippingCost = hasPhysicalItems
    ? Math.round((SHIPPING_RATES_USD[shippingMethod!] || 0) * rate * 100) / 100
    : 0
  const taxAmount = 0
  const totalInCurrency = Math.round((validatedSubtotal * rate + shippingCost + taxAmount) * 100) / 100

  // 1. Create Order using admin client (bypasses RLS for guest orders)
  const orderPayload: any = {
    user_id: user?.id || null,
    email: data.email,
    customer_name: data.name,
    customer_phone: data.phone,
    total_amount: totalInCurrency,
    currency: data.currency,
    status: 'pending',
    payment_status: 'pending'
  }

  if (hasPhysicalItems) {
    orderPayload.shipping_address = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country
    }
  }

  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .insert(orderPayload)
    .select()
    .single()

  if (orderError) return { error: orderError.message }

  // 2. Create Order Items
  const orderItems = data.items.map(item => {
    const product = products.find(p => p.id === item.id)!
    const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
    const unitPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)
    return {
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price_at_purchase: unitPrice
    }
  })

  const { error: itemsError } = await adminClient.from('order_items').insert(orderItems)
  if (itemsError) return { error: itemsError.message }

  const tx_ref = `KDC-${order.id.split('-')[0]}-${Date.now()}`

  if (gateway !== 'pesapal') {
    return { error: 'Unsupported payment gateway' }
  }

  try {
    const token = await getPesapalAuthToken()
    const names = data.name.trim().split(' ')
    const firstName = names[0] || 'Customer'
    const lastName = names.slice(1).join(' ') || firstName

    const psaResponse = await initiatePesapalPayment({
      id: tx_ref,
      amount: totalInCurrency,
      currency: data.currency,
      description: `Order #${order.id.split('-')[0]} from Kingdom Deliverance Store`,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/verify?gateway=pesapal`,
      notification_id: process.env.PESAPAL_IPN_ID!,
      billing_address: {
        email_address: data.email,
        phone_number: data.phone,
        first_name: firstName,
        last_name: lastName
      }
    }, token)

    const reference = psaResponse.order_tracking_id || tx_ref
    const paymentUrl = psaResponse.redirect_url || psaResponse.payment_url || psaResponse.url

    if (reference && paymentUrl) {
      await adminClient.from('transactions').insert({
        order_id: order.id,
        gateway: 'pesapal',
        reference,
        amount: totalInCurrency,
        currency: data.currency,
        status: 'pending'
      })
      return { success: true, paymentUrl }
    }

    return { error: psaResponse.message || 'Pesapal initiation failed' }
  } catch (err: any) {
    console.error('Pesapal Exception:', err)
    return { error: 'Failed to connect to Pesapal' }
  }

  return { error: 'Payment initiation failed. Please try again.' }
}
