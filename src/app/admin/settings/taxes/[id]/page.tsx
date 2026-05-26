import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { TaxRateForm, type TaxRateRow } from '@/components/admin/settings/tax-rate-form'

export default async function EditTaxRatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('tax_settings').select('*').eq('id', id).single()

  if (error || !data) notFound()

  return <TaxRateForm initial={data as TaxRateRow} />
}
