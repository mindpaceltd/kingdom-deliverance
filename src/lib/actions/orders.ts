'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPesapalAuthToken, initiatePesapalPayment } from '@/lib/payments/pesapal'
import { getPesapalSettings } from '@/lib/payments/pesapal-settings'
import { initiatePayPalPayment } from '@/lib/payments/paypal'

/**
 * Fetch payment gateway credentials from site_settings table.
 * Falls back to environment variables if not set in DB.
 */
async function getPaymentSettings() {
  const settings = await getPesapalSettings()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['paypal_client_id', 'paypal_secret', 'paypal_mode', 'paypal_enabled'])

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.value) map[row.key] = row.value
  }

  return {
    ...settings,
    paypalClientId: map.paypal_client_id || process.env.PAYPAL_CLIENT_ID || '',
    paypalSecret: map.paypal_secret || process.env.PAYPAL_SECRET || '',
    paypalMode: map.paypal_mode || process.env.PAYPAL_MODE || 'sandbox',
    paypalEnabled: map.paypal_enabled === 'true' || map.paypal_enabled === '1',
  }
}

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
  gateway: 'pesapal' | 'paypal'
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
    total_amount: totalInCurrency,
    currency: data.currency,
    status: 'pending',
    payment_status: 'pending',
    shipping_address: {
      name: data.name,
      phone: data.phone,
      address: data.address || null,
      city: data.city || null,
      country: data.country || null,
    },
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

  // Load payment credentials from DB settings
  const paySettings = await getPaymentSettings()

  try {
    if (gateway === 'pesapal') {
      const token = await getPesapalAuthToken(paySettings.consumerKey, paySettings.consumerSecret, paySettings.mode)
      const names = data.name.trim().split(' ')
      const firstName = names[0] || 'Customer'
      const lastName = names.slice(1).join(' ') || firstName

      const psaResponse = await initiatePesapalPayment({
        id: tx_ref,
        amount: totalInCurrency,
        currency: data.currency,
        description: `Order #${order.id.split('-')[0]} from Kingdom Deliverance Store`,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/verify?gateway=pesapal`,
        notification_id: paySettings.ipnId,
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
    } else if (gateway === 'paypal') {
      const paypalResponse = await initiatePayPalPayment({
        orderId: order.id,
        amount: totalInCurrency,
        currency: data.currency,
        description: `Order #${order.id.split('-')[0]} from Kingdom Deliverance Store`,
        returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/verify?gateway=paypal`,
        cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`
      })

      if (paypalResponse.success && paypalResponse.paymentUrl) {
        await adminClient.from('transactions').insert({
          order_id: order.id,
          gateway: 'paypal',
          reference: paypalResponse.orderId,
          amount: totalInCurrency,
          currency: data.currency,
          status: 'pending'
        })
        return { success: true, paymentUrl: paypalResponse.paymentUrl }
      }

      return { error: paypalResponse.error || 'PayPal initiation failed' }
    }

    return { error: 'Unsupported payment gateway' }
  } catch (err: any) {
    console.error('Payment Exception:', err)
    // Surface the real error in development, generic message in production
    const message = err?.message || 'Unknown error'
    return { error: message.includes('not configured') || message.includes('credentials')
      ? 'Payment gateway is not configured. Please contact support.'
      : 'Failed to initiate payment. Please try again.'
    }
  }
}

export async function deleteOrder(id: string) {
  const adminClient = createAdminClient()
  
  // 1. Delete order items first (due to foreign key)
  const { error: itemsError } = await adminClient
    .from('order_items')
    .delete()
    .eq('order_id', id)

  if (itemsError) return { success: false, error: itemsError.message }

  // 2. Delete transactions
  await adminClient
    .from('transactions')
    .delete()
    .eq('order_id', id)

  // 3. Delete the order
  const { error: orderError } = await adminClient
    .from('orders')
    .delete()
    .eq('id', id)

  if (orderError) return { success: false, error: orderError.message }

  return { success: true }
}

export async function updateOrderStatus(id: string, data: {
  status?: string
  payment_status?: string
}) {
  const adminClient = createAdminClient()
  
  const { error } = await adminClient
    .from('orders')
    .update(data)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true }
}
