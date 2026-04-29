import { createClient } from '@/lib/supabase/server'
import { AdminProvider } from '@/lib/admin-context'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow auth group routes (e.g. /admin/login) to render without forcing
  // the admin shell. Middleware already protects private admin pages.
  if (!user) {
    return <>{children}</>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return <>{children}</>
  }

  return (
    <AdminProvider value={{ user, profile, role: profile.role }}>
      <div className="flex min-h-screen bg-muted">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </AdminProvider>
  )
}
