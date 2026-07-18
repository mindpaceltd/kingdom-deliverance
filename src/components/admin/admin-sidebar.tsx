'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, ChevronDown } from 'lucide-react'
import { useAdmin } from '@/lib/admin-context'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { adminNavLinks } from '@/components/admin/admin-nav-links'

export function AdminSidebar({ logo }: { logo?: string }) {
  const { role } = useAdmin()
  const pathname = usePathname()
  const router = useRouter()
  const [openMenus, setOpenMenus] = React.useState<string[]>([])

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    )
  }

  // Auto-open menu if child is active
  React.useEffect(() => {
    adminNavLinks.forEach(link => {
      if (link.subLinks?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'))) {
        setOpenMenus(prev =>
          prev.includes(link.label) ? prev : [...prev, link.label]
        )
      }
    })
  }, [pathname])

  const navLinks = adminNavLinks.filter(
    (link) => !link.adminOnly || role === 'admin'
  )

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-[#1a1a2e] text-white shrink-0 sticky top-0 overflow-y-auto border-r border-white/5 scrollbar-hide">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10 shrink-0 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 overflow-hidden">
          {logo ? (
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary font-bold text-sm">K</span>
          )}
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight block">KDC Uganda</span>
          <p className="text-[10px] text-white/50">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map((link) => {
          const hasSubLinks = link.subLinks && link.subLinks.length > 0
          const isOpen = openMenus.includes(link.label)

          const isActive = link.href === '/admin'
            ? pathname === '/admin'
            : pathname === link.href || pathname.startsWith(link.href + '/')

          return (
            <div key={link.label} className="space-y-1">
              {hasSubLinks ? (
                <button
                  onClick={() => toggleMenu(link.label)}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors group',
                    isActive || link.subLinks?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'))
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <link.icon className="h-4 w-4 shrink-0" />
                    {link.label}
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200 opacity-50 group-hover:opacity-100",
                    isOpen && "rotate-180"
                  )} />
                </button>
              ) : (
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              )}

              {/* Sub Links */}
              {hasSubLinks && isOpen && (
                <div className="pl-9 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                  {link.subLinks!.map((sub) => {
                    const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/')
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                          isSubActive
                            ? 'text-white bg-white/5'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {sub.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10 shrink-0 mt-auto">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  )
}
