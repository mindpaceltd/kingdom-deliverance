import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import {
  PaymentGatewayForm,
  type PaymentGatewayRow,
} from '@/components/admin/settings/payment-gateway-form'

export default async function EditPaymentGatewayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('payment_gateways').select('*').eq('id', id).single()

  if (error || !data) notFound()

  return <PaymentGatewayForm gateway={data as PaymentGatewayRow} />
}
