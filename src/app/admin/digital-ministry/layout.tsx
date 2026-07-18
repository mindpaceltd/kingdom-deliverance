import { requireStaff } from '@/lib/authz'
import { DigitalMinistrySubnav } from '@/components/admin/digital-ministry/dm-subnav'

export default async function DigitalMinistryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await requireStaff()
  if ('error' in auth) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        You do not have permission to access AI Digital Ministry.
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <DigitalMinistrySubnav />
      {children}
    </div>
  )
}
