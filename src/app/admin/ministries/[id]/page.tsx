import { notFound } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MinistryEditorClient } from '@/components/admin/ministries/ministry-editor-client'
import type { Ministry } from '@/lib/types'

export default async function EditMinistryPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  
  const { data: ministry } = await supabase
    .from('ministries')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!ministry) {
    notFound()
  }

  return <MinistryEditorClient ministry={ministry as Ministry} />
}
