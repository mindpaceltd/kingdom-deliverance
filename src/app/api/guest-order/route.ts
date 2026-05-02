import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  const orderId = request.nextUrl.searchParams.get('order_id')

  if (!email || !orderId) {
    return NextResponse.json({ error: 'Email and Order ID are required.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Look up order by ID and verify email matches
  const searchByOrderNumber = /^[0-9]+$/.test(orderId)
  const conditions = [`id.eq.${orderId}`]
  if (searchByOrderNumber) {
    conditions.push(`order_number.eq.${orderId}`)
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total_amount, currency, created_at, email')
    .or(conditions.join(','))
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found. Please check your email and order ID.' }, { status: 404 })
  }

  // Fetch download tokens
  const { data: downloads } = await supabase
    .from('download_tokens')
    .select('id, token, download_count, max_downloads, expires_at, product:products(name)')
    .eq('order_id', order.id)
    .eq('email', email.toLowerCase().trim())

  return NextResponse.json({
    order: { ...order, email: undefined }, // Don't echo back email
    downloads: downloads || [],
  })
}
