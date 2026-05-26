import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import {
  EmailTemplateForm,
  type EmailTemplateRow,
} from '@/components/admin/settings/email-template-form'

export default async function EditEmailTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('email_templates').select('*').eq('id', id).single()

  if (error || !data) notFound()

  return <EmailTemplateForm initial={data as EmailTemplateRow} />
}
