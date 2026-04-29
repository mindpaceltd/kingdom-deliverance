import { createClient } from '@/lib/supabase/server'
import { EventsManager } from '@/components/admin/events/events-manager'
import type { Event } from '@/lib/types'

export default async function AdminEventsPage() {
  const supabase = createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })

  return <EventsManager initialEvents={(events as Event[]) ?? []} />
}
