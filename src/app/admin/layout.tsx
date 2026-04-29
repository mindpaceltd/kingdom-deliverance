import { redirect } from 'next/navigation'
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

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/admin/login')
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
