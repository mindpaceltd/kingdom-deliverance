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
  UserCircleIcon,
  BarChart,
  MessageCircle,
  FolderOpen,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin-context'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const allNavLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart, adminOnly: true },
  { href: '/admin/posts', label: 'Posts & Blogs', icon: FileText, adminOnly: false },
  { href: '/admin/sermons', label: 'Sermons', icon: Video, adminOnly: false },
  { href: '/admin/sermons/series', label: 'Sermon Series', icon: GalleryHorizontal, adminOnly: false },
  { href: '/admin/events', label: 'Events', icon: Calendar, adminOnly: false },
  { href: '/admin/ministries', label: 'Ministries', icon: Users2, adminOnly: false },
  { href: '/admin/media', label: 'Media Library', icon: Images, adminOnly: false },
  { href: '/admin/gallery', label: 'Gallery', icon: GalleryHorizontal, adminOnly: false },
  { href: '/admin/products', label: 'Products', icon: GalleryHorizontal, adminOnly: false },
  { href: '/admin/products/categories', label: 'Categories', icon: FolderOpen, adminOnly: false },
  { href: '/admin/products/attributes', label: 'Attributes', icon: Settings, adminOnly: false },
  { href: '/admin/orders', label: 'Orders', icon: Inbox, adminOnly: false },
  { href: '/admin/inbox', label: 'Inbox', icon: Inbox, adminOnly: false },
  { href: '/admin/testimonies', label: 'Testimonies', icon: MessageCircle, adminOnly: false },
  { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
  { href: '/admin/profile', label: 'My Profile', icon: UserCircleIcon, adminOnly: false },
]

export function AdminSidebar() {
  const { role } = useAdmin()
  const pathname = usePathname()
  const router = useRouter()

  const navLinks = allNavLinks.filter(
    (link) => !link.adminOnly || role === 'admin'
  )

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-[#1a1a2e] text-white shrink-0 sticky top-0 overflow-y-auto border-r border-white/5">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10 shrink-0">
        <span className="text-lg font-bold tracking-tight">KDC Uganda</span>
        <p className="text-xs text-white/50 mt-0.5">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/admin'
              ? pathname === '/admin'
              : pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
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
