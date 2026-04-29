'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useAdmin } from '@/lib/admin-context'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { MobileDrawer } from '@/components/admin/mobile-drawer'
import { getInitials } from '@/components/admin/initials'

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
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname]

  // Match by prefix (e.g. /admin/posts/new → "Posts & Blogs")
  for (const [path, title] of Object.entries(pageTitles)) {
    if (path !== '/admin' && pathname.startsWith(path + '/')) {
      return title
    }
  }

  return 'Admin'
}

export function AdminHeader() {
  const { profile } = useAdmin()
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const pageTitle = getPageTitle(pathname)
  const initials = getInitials(profile.name)

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

        {/* User avatar */}
        <div className="flex items-center">
          {profile.avatar_url ? (
            <Avatar>
              <AvatarImage src={profile.avatar_url} alt={profile.name ?? 'User avatar'} />
            </Avatar>
          ) : (
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
