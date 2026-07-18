'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DM_NAV } from '@/lib/digital-ministry/types'

export function DigitalMinistrySubnav() {
  const pathname = usePathname()

  return (
    <nav className="-mx-1 mb-6 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-1 px-1">
        {DM_NAV.filter((item) => !item.href.includes('/accounts/') || item.href.endsWith('/accounts')).map(
          (item) => {
            const active =
              item.href === '/admin/digital-ministry'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            )
          }
        )}
      </div>
    </nav>
  )
}
