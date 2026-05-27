'use client'

import { useState, useEffect } from 'react'
import { getUserCreditBalance } from '@/lib/actions/credits'
import { Wallet, Loader2 } from 'lucide-react'
import { createClient, getBrowserSession } from '@/lib/supabase/client'
import Link from 'next/link'

export function CreditWallet() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadBalance() {
      const { data: { session } } = await getBrowserSession()
      const user = session?.user ?? null
      if (user?.email) {
        const bal = await getUserCreditBalance(user.email)
        setBalance(bal)
      } else {
        setBalance(null)
      }
      setLoading(false)
    }

    loadBalance()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadBalance()
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-white/50" />
  if (balance === null) return null

  return (
    <Link
      href="/account"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-sm hover:bg-accent/20 transition-colors"
    >
      <Wallet className="w-3.5 h-3.5" />
      <span>{balance}</span>
    </Link>
  )
}
