'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Settings, CreditCard, Percent, Mail, Globe } from 'lucide-react'

const SETTINGS_TABS = [
  { href: '/admin/settings', label: 'General', icon: Globe },
  { href: '/admin/settings/taxes', label: 'Tax Settings', icon: Percent },
  { href: '/admin/settings/payments', label: 'Payment Systems', icon: CreditCard },
  { href: '/admin/settings/emails', label: 'Email Templates', icon: Mail },
]

export function SettingsTabs() {
  const pathname = usePathname()

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex gap-1 overflow-x-auto">
        {SETTINGS_TABS.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-[#1e3a5f] text-[#1e3a5f]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
