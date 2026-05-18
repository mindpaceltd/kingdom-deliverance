'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { sendOrderConfirmation } from '@/lib/emails/order-confirmation'
import { randomBytes } from 'crypto'

/**
 * Finalize an order after successful payment verification.
 * Idempotent: checks if already finalized before proceeding.
 */
export async function finalizeOrder(orderId: string) {
  const supabase = createAdminClient()

  // 1. Fetch the order with items and products
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        product:products(*)
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    console.error('finalizeOrder: order not found', orderId, error)
    return { error: 'Order not found' }
  }

  // Idempotency check: if already completed/processing with tokens, skip
  if (order.status === 'completed' || order.status === 'processing') {
    const { data: existingTokens } = await supabase
      .from('download_tokens')
      .select('id')
      .eq('order_id', orderId)
      .limit(1)

    if (existingTokens && existingTokens.length > 0) {
      return { success: true, alreadyFinalized: true }
    }
  }

  // 2. Determine if all items are digital
  const allDigital = order.order_items.every(
    (item: any) => item.product?.type === 'digital'
  )
  const hasDigital = order.order_items.some(
    (item: any) => item.product?.type === 'digital'
  )

  // 3. Update order status
  const newStatus = allDigital ? 'completed' : 'processing'
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus, payment_status: 'paid' })
    .eq('id', orderId)

  if (updateError) {
    console.error('finalizeOrder: failed to update order status', updateError)
  }

  // 3b. Link order to user account if a user with this email exists (claim guest order)
  if (!order.user_id && order.email) {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const matchedUser = users?.find((u: any) => u.email === order.email)
    if (matchedUser?.id) {
      await supabase
        .from('orders')
        .update({ user_id: matchedUser.id })
        .eq('id', orderId)
    }
  }

  // 4. Generate download tokens for digital items
  // Create tokens for ALL digital items regardless of file_url — file may be uploaded later
  const downloadTokens: any[] = []
  if (hasDigital) {
    const digitalItems = order.order_items.filter(
      (item: any) => item.product?.type === 'digital'
    )

    for (const item of digitalItems) {
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiry

      const tokenData = {
        order_id: orderId,
        order_item_id: item.id,
        product_id: item.product_id,
        token,
        email: order.email,
        max_downloads: 10,
        expires_at: expiresAt.toISOString(),
      }

      const { data: insertedToken, error: tokenError } = await supabase
        .from('download_tokens')
        .insert(tokenData)
        .select()
        .single()

      if (tokenError) {
        console.error('finalizeOrder: failed to insert download token', tokenError)
      } else if (insertedToken) {
        downloadTokens.push({
          ...insertedToken,
          product_name: item.product.name,
        })
      }
    }
  }

  // 5. Send order confirmation email
  try {
    await sendOrderConfirmation(order, downloadTokens)
  } catch (err) {
    console.error('finalizeOrder: email send failed', err)
    // Don't fail the whole flow if email fails
  }

  return { success: true, downloadTokens }
}
