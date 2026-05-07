'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, UserIcon, LogOutIcon, ChevronDownIcon } from 'lucide-react'
import { useAdmin } from '@/lib/admin-context'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { MobileDrawer } from '@/components/admin/mobile-drawer'
import { getInitials } from '@/components/admin/initials'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/posts': 'Posts & Blogs',
  '/admin/sermons': 'Sermons',
  '/admin/events': 'Events',
  '/admin/ministries': 'Ministries',
  '/admin/media': 'Media Library',
  '/admin/gallery': 'Gallery',
  '/admin/inbox': 'Inbox',
  '/admin/users': 'Users',
  '/admin/settings': 'Settings',
  '/admin/profile': 'My Profile',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  for (const [path, title] of Object.entries(pageTitles)) {
    if (path !== '/admin' && pathname.startsWith(path + '/')) return title
  }
  return 'Admin'
}

export function AdminHeader({ logo }: { logo?: string }) {
  const { profile } = useAdmin()
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const pageTitle = getPageTitle(pathname)
  const initials = getInitials(profile.name)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    setDropdownOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <>
      <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background shrink-0">
        {/* Hamburger — mobile only */}
        <button
          className="lg:hidden flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title */}
        <h1 className="text-base font-semibold text-foreground flex-1 ml-2 lg:ml-0">
          {pageTitle}
        </h1>

        {/* User avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted transition-colors"
            aria-label="User menu"
          >
            <Avatar className="size-8">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.name ?? 'Avatar'} />
              ) : (
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              )}
            </Avatar>
            <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
              {profile.name ?? 'Account'}
            </span>
            <ChevronDownIcon className={cn('size-3.5 text-muted-foreground transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-popover shadow-lg overflow-hidden z-50">
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-sm font-medium truncate">{profile.name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
              </div>

              {/* Profile link */}
              <button
                type="button"
                onClick={() => { setDropdownOpen(false); router.push('/admin/profile') }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <UserIcon className="size-4 text-muted-foreground" />
                My Profile
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left text-destructive"
              >
                <LogOutIcon className="size-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} logo={logo} />
    </>
  )
}
