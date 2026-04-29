import { createClient } from '@/lib/supabase/server'
import { InboxClient } from '@/components/admin/inbox/inbox-client'
import type { ContactSubmission, PrayerRequest } from '@/lib/types'

export default async function AdminInboxPage() {
  const supabase = createClient()

  const { data: contacts } = await supabase
    .from('contact_submissions')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  const { data: prayers } = await supabase
    .from('prayer_requests')
    .select('*')
    .eq('is_reviewed', false)
    .order('created_at', { ascending: false })

  return (
    <InboxClient
      initialContacts={(contacts as ContactSubmission[]) ?? []}
      initialPrayers={(prayers as PrayerRequest[]) ?? []}
    />
  )
}
