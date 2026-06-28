import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Package, Download, User, LogOut, LayoutDashboard } from 'lucide-react'
import { NOINDEX_METADATA } from '@/lib/seo/noindex-metadata'

export const metadata: Metadata = NOINDEX_METADATA

const NAV_ITEMS = [
  { href: '/account', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/downloads', label: 'Downloads', icon: Download },
  { href: '/account/profile', label: 'Profile', icon: User },
]

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/account/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="mb-4 pb-4 border-b border-gray-100">
                <p className="font-bold text-sm text-gray-900 truncate">{user.user_metadata?.full_name || 'Customer'}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
