import {
  LayoutDashboard,
  FileText,
  FileStack,
  Video,
  Calendar,
  Users2,
  Images,
  GalleryHorizontal,
  Inbox,
  UserPlus,
  Users,
  Settings,
  UserCircleIcon,
  BarChart,
  MessageCircle,
  FolderOpen,
  ShoppingBag,
  ListOrdered,
  QrCode,
  type LucideIcon,
} from 'lucide-react'

export interface AdminNavSubLink {
  href: string
  label: string
  icon: LucideIcon
}

export interface AdminNavLink {
  href: string
  label: string
  icon: LucideIcon
  adminOnly: boolean
  subLinks?: AdminNavSubLink[]
}

export const adminNavLinks: AdminNavLink[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart, adminOnly: true },
  { href: '/admin/posts', label: 'Posts & Blogs', icon: FileText, adminOnly: false },
  {
    href: '/admin/sermons',
    label: 'Sermons',
    icon: Video,
    adminOnly: false,
    subLinks: [
      { href: '/admin/sermons', label: 'All Sermons', icon: Video },
      { href: '/admin/sermons/series', label: 'Sermon Series', icon: GalleryHorizontal },
    ],
  },
  { href: '/admin/events', label: 'Events', icon: Calendar, adminOnly: false },
  { href: '/admin/ministries', label: 'Ministries', icon: Users2, adminOnly: false },
  { href: '/admin/pages', label: 'Pages', icon: FileStack, adminOnly: false },
  { href: '/admin/media', label: 'Media Library', icon: Images, adminOnly: false },
  { href: '/admin/gallery', label: 'Gallery', icon: GalleryHorizontal, adminOnly: false },
  {
    href: '/admin/products',
    label: 'KDC Store',
    icon: ShoppingBag,
    adminOnly: false,
    subLinks: [
      { href: '/admin/products', label: 'Products', icon: ShoppingBag },
      { href: '/admin/products/categories', label: 'Categories', icon: FolderOpen },
      { href: '/admin/products/attributes', label: 'Attributes', icon: Settings },
      { href: '/admin/orders', label: 'Orders', icon: ListOrdered },
    ],
  },
  {
    href: '/admin/credits',
    label: 'Credits & Services',
    icon: BarChart,
    adminOnly: true,
    subLinks: [
      { href: '/admin/credits', label: 'User Balances', icon: Users },
      { href: '/admin/credits/requests', label: 'Service Requests', icon: MessageCircle },
      { href: '/admin/credits/transactions', label: 'Transaction History', icon: BarChart },
    ],
  },
  { href: '/admin/inbox', label: 'Inbox', icon: Inbox, adminOnly: false },
  { href: '/admin/leads', label: 'Leads', icon: UserPlus, adminOnly: false },
  { href: '/admin/support', label: 'Live Support', icon: MessageCircle, adminOnly: false },
  { href: '/admin/testimonies', label: 'Testimonies', icon: MessageCircle, adminOnly: false },
  { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
  { href: '/admin/qr-codes', label: 'QR Codes', icon: QrCode, adminOnly: true },
  { href: '/admin/profile', label: 'My Profile', icon: UserCircleIcon, adminOnly: false },
]

export const adminPageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/analytics': 'Analytics',
  '/admin/posts': 'Posts & Blogs',
  '/admin/sermons': 'Sermons',
  '/admin/sermons/series': 'Sermon Series',
  '/admin/events': 'Events',
  '/admin/ministries': 'Ministries',
  '/admin/pages': 'Pages',
  '/admin/media': 'Media Library',
  '/admin/gallery': 'Gallery',
  '/admin/products': 'KDC Store',
  '/admin/products/categories': 'Categories',
  '/admin/products/attributes': 'Attributes',
  '/admin/orders': 'Orders',
  '/admin/credits': 'Credits & Services',
  '/admin/credits/requests': 'Service Requests',
  '/admin/credits/transactions': 'Transaction History',
  '/admin/inbox': 'Inbox',
  '/admin/leads': 'Leads',
  '/admin/support': 'Live Support',
  '/admin/testimonies': 'Testimonies',
  '/admin/users': 'Users',
  '/admin/settings': 'Settings',
  '/admin/qr-codes': 'QR Codes',
  '/admin/profile': 'My Profile',
}

export function getAdminPageTitle(pathname: string): string {
  if (adminPageTitles[pathname]) return adminPageTitles[pathname]
  // Prefer longer/more specific paths first
  const entries = Object.entries(adminPageTitles).sort(
    ([a], [b]) => b.length - a.length
  )
  for (const [path, title] of entries) {
    if (path !== '/admin' && pathname.startsWith(path + '/')) return title
  }
  return 'Admin'
}
