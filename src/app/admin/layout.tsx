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

  // Fetch logo from both site_settings and organization_images
  const [logoSetting, orgLogoResult] = await Promise.all([
    supabase.from('site_settings').select('value').eq('key', 'site_logo').single(),
    supabase.from('organization_images').select('url').eq('type', 'logo').eq('is_active', true).maybeSingle()
  ])
  const logo = orgLogoResult.data?.url || logoSetting.data?.value

  return (
    <AdminProvider value={{ user, profile, role: profile.role }}>
      <div className="flex h-screen overflow-hidden bg-muted">
        <AdminSidebar logo={logo} />
        <main className="flex-1 flex flex-col min-w-0">
          <AdminHeader logo={logo} />
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </AdminProvider>
  )
}
