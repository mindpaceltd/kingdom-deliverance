'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LayoutDashboard, Package, Download, LogOut, Wallet } from 'lucide-react'

export function UserNav() {
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user?.email) {
        // Fetch credit balance
        supabase
          .from('user_credits')
          .select('balance')
          .eq('email', user.email)
          .maybeSingle()
          .then(({ data }) => setCredits(data?.balance ?? 0))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setCredits(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/account/login')
    router.refresh()
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account'

  if (!user) {
    // Not logged in — show icon link to login
    return (
      <Link
        href="/account/login"
        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Sign in"
      >
        <User className="w-4 h-4" />
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors pl-1 pr-3 py-1 text-white"
          aria-label="Account menu"
        >
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full overflow-hidden bg-accent/20 flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5 text-accent" />
            )}
          </div>
          {/* Credits badge */}
          {credits !== null && credits > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
              <Wallet className="w-3 h-3" />
              {credits}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52 bg-[#0d1b3e]/98 backdrop-blur-xl border border-white/10 text-white rounded-xl p-1.5 shadow-2xl"
      >
        {/* User info */}
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-bold text-white truncate">{displayName}</p>
          <p className="text-[10px] text-white/40 truncate">{user.email}</p>
        </div>

        <DropdownMenuSeparator className="bg-white/10 my-1" />

        <DropdownMenuItem asChild className="rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer text-sm gap-2.5 px-3 py-2">
          <Link href="/account">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer text-sm gap-2.5 px-3 py-2">
          <Link href="/account/orders">
            <Package className="w-4 h-4" /> My Orders
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer text-sm gap-2.5 px-3 py-2">
          <Link href="/account/downloads">
            <Download className="w-4 h-4" /> Downloads
          </Link>
        </DropdownMenuItem>

        {credits !== null && (
          <DropdownMenuItem asChild className="rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer text-sm gap-2.5 px-3 py-2">
            <Link href="/account">
              <Wallet className="w-4 h-4" />
              <span>{credits} Credits</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-white/10 my-1" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer text-sm gap-2.5 px-3 py-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
