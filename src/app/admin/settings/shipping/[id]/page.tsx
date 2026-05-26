import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import {
  ShippingRateForm,
  type ShippingRateRow,
} from '@/components/admin/settings/shipping-rate-form'

export default async function EditShippingRatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('shipping_settings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  return <ShippingRateForm initial={data as ShippingRateRow} />
}
