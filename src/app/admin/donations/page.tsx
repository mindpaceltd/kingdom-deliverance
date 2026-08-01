import { listAdminDonations } from '@/lib/actions/donations-admin'
import { DonationsManager } from '@/components/admin/donations/donations-manager'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/authz'

export default async function AdminDonationsPage() {
  const auth = await requireAdmin()
  if ('error' in auth) redirect('/admin')

  const donations = await listAdminDonations()

  return <DonationsManager initialDonations={donations} />
}
