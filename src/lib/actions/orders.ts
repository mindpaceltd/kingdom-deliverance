'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPesapalAuthToken, initiatePesapalPayment } from '@/lib/payments/pesapal'
import { getPesapalSettings } from '@/lib/payments/pesapal-settings'
import { initiatePayPalPayment } from '@/lib/payments/paypal'
import { getExchangeRates } from '@/lib/services/exchange-rates'
import { getDefaultPublicOrigin } from '@/lib/seo/public-content-urls'

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
    .in('key', ['paypal_client_id', 'paypal_secret', 'paypal_mode', 'paypal_enabled', 'pesapal_enabled'])

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.value) map[row.key] = row.value
  }

  const paypalClientId = map.paypal_client_id || process.env.PAYPAL_CLIENT_ID || ''
  const paypalSecret =
    map.paypal_secret || process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET || ''

  return {
    ...settings,
    paypalClientId,
    paypalSecret,
    paypalMode: map.paypal_mode || process.env.PAYPAL_MODE || 'sandbox',
    // A gateway is only usable when it is enabled AND has credentials.
    paypalEnabled:
      (map.paypal_enabled === 'true' || map.paypal_enabled === '1') &&
      Boolean(paypalClientId && paypalSecret),
    pesapalEnabled:
      map.pesapal_enabled !== 'false' &&
      map.pesapal_enabled !== '0' &&
      Boolean(settings.consumerKey && settings.consumerSecret),
  }
}

/**
 * Payment methods the storefront may offer. Checkout uses this so a shopper is
 * never shown a gateway that cannot complete a payment.
 */
export async function getAvailableGateways() {
  try {
    const settings = await getPaymentSettings()
    return {
      pesapal: settings.pesapalEnabled,
      paypal: settings.paypalEnabled,
    }
  } catch (err) {
    console.error('getAvailableGateways failed:', err)
    return { pesapal: true, paypal: false }
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
  
  if (!data.items?.length) {
    return { error: 'Your cart is empty.' }
  }

  // Server-side price validation: re-fetch products from DB
  const productIds = data.items.map(item => item.id)
  const { data: products, error: productsError } = await adminClient
    .from('products')
    .select('id, price_usd, regular_price_usd, sale_price_usd, is_active')
    .in('id', productIds)

  if (productsError) {
    console.error('createOrder: product lookup failed', productsError)
    return { error: `Could not verify your cart: ${productsError.message}` }
  }

  // Carts live in localStorage, so they can outlive a product re-import.
  // Report the exact stale ids so checkout can drop them and let the shopper retry.
  const productById = new Map((products ?? []).map(p => [p.id, p]))
  const invalidItems = data.items.filter(item => {
    const product = productById.get(item.id)
    return !product || !product.is_active
  })

  if (invalidItems.length) {
    const names = invalidItems.map(i => i.name).filter(Boolean)
    return {
      error:
        names.length === 1
          ? `"${names[0]}" is no longer available and was removed from your cart.`
          : `${invalidItems.length} items are no longer available and were removed from your cart.`,
      invalidItemIds: invalidItems.map(i => i.id),
    }
  }

  // Recalculate total from DB prices
  let validatedSubtotal = 0
  for (const item of data.items) {
    const product = productById.get(item.id)!
    const salePrice = Number(product.sale_price_usd) || 0
    const regularPrice = Number(product.regular_price_usd) || 0
    const basePrice = Number(product.price_usd) || 0
    const hasDiscount = salePrice > 0 && salePrice < regularPrice
    const unitPrice = hasDiscount ? salePrice : regularPrice || basePrice
    validatedSubtotal += unitPrice * item.quantity
  }

  // Apply currency conversion using the same rate source the storefront prices with,
  // so the amount charged always matches the amount displayed.
  const RATES = await getExchangeRates()
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
    customer_name: data.name?.trim() || null,
    customer_phone: data.phone?.trim() || null,
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

  if (orderError || !order) {
    console.error('createOrder: order insert failed', orderError, {
      currency: data.currency,
      total: totalInCurrency,
      itemCount: data.items.length,
    })
    return { error: orderError?.message || 'Could not create your order. Please try again.' }
  }

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
  if (itemsError) {
    console.error('createOrder: order_items insert failed', itemsError, { orderId: order.id })
    return { error: itemsError.message }
  }

  const tx_ref = `KDC-${order.id.split('-')[0]}-${Date.now()}`

  // Load payment credentials from DB settings
  const paySettings = await getPaymentSettings()

  if (gateway === 'paypal' && !paySettings.paypalEnabled) {
    return { error: 'PayPal is not available right now. Please pay with mobile money or card.' }
  }
  if (gateway === 'pesapal' && !paySettings.pesapalEnabled && totalInCurrency > 0) {
    return { error: 'Payment gateway is not configured. Please contact support.' }
  }

  try {
    if (gateway === 'pesapal') {
      // ── FREE ORDER: skip payment gateway, complete immediately ──────────────
      if (totalInCurrency === 0) {
        if (!user) {
          return { error: 'Please sign in to claim free items.' }
        }
        const { error: freeTxError } = await adminClient.from('transactions').insert({
          order_id: order.id,
          gateway: 'free',
          reference: tx_ref,
          amount: 0,
          currency: data.currency,
          status: 'success',
        })
        if (freeTxError) {
          console.error('createOrder: free transaction insert failed', freeTxError)
        }
        const { finalizeOrder } = await import('@/lib/orders/finalize')
        await finalizeOrder(order.id)
        return { success: true, paymentUrl: `/checkout/success?order_id=${order.id}` }
      }

      const token = await getPesapalAuthToken(paySettings.consumerKey, paySettings.consumerSecret, paySettings.mode)
      const names = data.name.trim().split(' ')
      const firstName = names[0] || 'Customer'
      const lastName = names.slice(1).join(' ') || firstName

      const siteUrl = getDefaultPublicOrigin()

      const psaResponse = await initiatePesapalPayment({
        id: tx_ref,
        amount: totalInCurrency,
        currency: data.currency,
        description: `Order #${order.id.split('-')[0]} from Kingdom Deliverance Store`,
        callback_url: `${siteUrl}/api/payments/verify?gateway=pesapal`,
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
        const { error: txError } = await adminClient.from('transactions').insert({
          order_id: order.id,
          gateway: 'pesapal',
          reference,
          amount: totalInCurrency,
          currency: data.currency,
          status: 'pending'
        })
        if (txError) {
          // Without this row the callback cannot match the payment back to the order.
          console.error('createOrder: pesapal transaction insert failed', txError, {
            orderId: order.id,
            reference,
          })
          return { error: 'Could not start payment tracking. Please try again or contact support.' }
        }
        return { success: true, paymentUrl }
      }

      console.error('Pesapal response missing redirect_url:', JSON.stringify(psaResponse))
      return { error: psaResponse.message || psaResponse.error?.message || 'Pesapal initiation failed — no redirect URL returned' }
    } else if (gateway === 'paypal') {
      const siteUrl = getDefaultPublicOrigin()
      const paypalResponse = await initiatePayPalPayment({
        orderId: order.id,
        amount: totalInCurrency,
        currency: data.currency,
        description: `Order #${order.id.split('-')[0]} from Kingdom Deliverance Store`,
        returnUrl: `${siteUrl}/api/payments/verify?gateway=paypal`,
        cancelUrl: `${siteUrl}/checkout`
      })

      if (paypalResponse.success && paypalResponse.paymentUrl) {
        const { error: txError } = await adminClient.from('transactions').insert({
          order_id: order.id,
          gateway: 'paypal',
          reference: paypalResponse.orderId,
          amount: totalInCurrency,
          currency: data.currency,
          status: 'pending'
        })
        if (txError) {
          console.error('createOrder: paypal transaction insert failed', txError, {
            orderId: order.id,
          })
          return { error: 'Could not start payment tracking. Please try again or contact support.' }
        }
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
