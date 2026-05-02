import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventEditorClient } from '@/components/admin/events/event-editor-client'
import type { Event } from '@/lib/types'

export default async function EditEventPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) {
    notFound()
  }

  return <EventEditorClient event={event as Event} />
}
