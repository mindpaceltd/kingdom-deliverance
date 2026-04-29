'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Video,
  Calendar,
  Users2,
  Images,
  GalleryHorizontal,
  Inbox,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin-context'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'

const allNavLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/admin/posts', label: 'Posts & Blogs', icon: FileText, adminOnly: false },
  { href: '/admin/sermons', label: 'Sermons', icon: Video, adminOnly: false },
  { href: '/admin/events', label: 'Events', icon: Calendar, adminOnly: false },
  { href: '/admin/ministries', label: 'Ministries', icon: Users2, adminOnly: false },
  { href: '/admin/media', label: 'Media Library', icon: Images, adminOnly: false },
  { href: '/admin/gallery', label: 'Gallery', icon: GalleryHorizontal, adminOnly: false },
  { href: '/admin/inbox', label: 'Inbox', icon: Inbox, adminOnly: false },
  { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
]

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { role } = useAdmin()
  const pathname = usePathname()
  const router = useRouter()

  const navLinks = allNavLinks.filter(
    (link) => !link.adminOnly || role === 'admin'
  )

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    onClose()
    router.push('/admin/login')
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent
        side="left"
        showCloseButton={true}
        className="flex flex-col gap-0 p-0 bg-[#1a1a2e] text-white border-r border-white/10 w-64 sm:max-w-64"
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-lg font-bold tracking-tight">KDC Uganda</span>
          <p className="text-xs text-white/50 mt-0.5">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/admin'
                ? pathname === '/admin'
                : pathname === href || pathname.startsWith(href + '/')

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
