import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Coins, History, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { CreditAdjustmentDialog } from '@/components/admin/credits/adjustment-dialog'
import { cn } from '@/lib/utils'

export default async function AdminCreditsPage() {
  const adminClient = createAdminClient()

  // 1. Fetch all auth users (the source of truth for emails)
  const { data: authData } = await adminClient.auth.admin.listUsers()
  const authUsers = authData?.users ?? []

  // 2. Build email → profile lookup from profiles table
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, name, role, created_at')

  const profileMap = new Map<string, any>()
  profiles?.forEach(p => profileMap.set(p.id, p))

  // 3. Fetch all user_credits (keyed by email)
  const { data: allCredits } = await adminClient
    .from('user_credits')
    .select('*')
    .order('balance', { ascending: false })

  const creditsByEmail = new Map<string, any>()
  allCredits?.forEach(c => {
    if (c.email) creditsByEmail.set(c.email.toLowerCase(), c)
  })

  // 4. Fetch recent credit transactions
  const { data: recentTxns } = await adminClient
    .from('credit_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // 5. Merge: auth users as the base, enrich with profile + credits
  const items = authUsers.map(u => {
    const email = u.email?.toLowerCase() || ''
    const profile = profileMap.get(u.id)
    const credits = creditsByEmail.get(email) || {
      balance: 0,
      lifetime_earned: 0,
      lifetime_spent: 0,
      updated_at: u.created_at,
    }
    return {
      id: u.id,
      email: u.email || '',
      name: profile?.name || u.email || 'Unknown',
      role: profile?.role || 'member',
      joined: u.created_at,
      balance: credits.balance ?? 0,
      lifetime_earned: credits.lifetime_earned ?? 0,
      lifetime_spent: credits.lifetime_spent ?? 0,
      updated_at: credits.updated_at || u.created_at,
    }
  })

  // Summary stats
  const totalCredits = items.reduce((acc, i) => acc + i.balance, 0)
  const totalEverEarned = items.reduce((acc, i) => acc + i.lifetime_earned, 0)
  const totalEverSpent = items.reduce((acc, i) => acc + i.lifetime_spent, 0)
  const activeWallets = items.filter(i => i.balance > 0 || i.lifetime_earned > 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Credit Balances</h1>
          <p className="text-muted-foreground">Monitor and manage user credit accounts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/credits/transactions">
              <History className="h-4 w-4 mr-2" />
              All Transactions
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/credits/requests">
              View Service Requests
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border bg-card shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Credits in System</p>
            <p className="text-2xl font-bold" suppressHydrationWarning>
              {totalCredits.toLocaleString('en-US')}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl border bg-card shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Wallets</p>
            <p className="text-2xl font-bold" suppressHydrationWarning>
              {activeWallets}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl border bg-card shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Ever Earned</p>
            <p className="text-2xl font-bold" suppressHydrationWarning>
              {totalEverEarned.toLocaleString('en-US')}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl border bg-card shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
            <ArrowDownRight className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Ever Spent</p>
            <p className="text-2xl font-bold" suppressHydrationWarning>
              {totalEverSpent.toLocaleString('en-US')}
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">All Users ({items.length})</h2>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-primary text-xs uppercase tracking-wider">User</th>
                <th className="px-6 py-3 font-semibold text-primary text-xs uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 font-semibold text-primary text-xs uppercase tracking-wider">Earned</th>
                <th className="px-6 py-3 font-semibold text-primary text-xs uppercase tracking-wider">Spent</th>
                <th className="px-6 py-3 font-semibold text-primary text-xs uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 font-semibold text-primary text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary">{item.name}</span>
                          <Badge variant="outline" className={cn(
                            "text-[10px] px-1.5 py-0 h-4 uppercase font-bold tracking-tighter",
                            item.role === 'admin' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            item.role === 'editor' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {item.role}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-3 w-3 text-accent" />
                        <span className={cn(
                          "font-bold tabular-nums",
                          item.balance > 0 ? "text-accent" : "text-muted-foreground/50"
                        )} suppressHydrationWarning>
                          {item.balance.toLocaleString('en-US')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-green-600 font-medium tabular-nums" suppressHydrationWarning>
                      +{item.lifetime_earned.toLocaleString('en-US')}
                    </td>
                    <td className="px-6 py-4 text-red-500 font-medium tabular-nums" suppressHydrationWarning>
                      -{item.lifetime_spent.toLocaleString('en-US')}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs" suppressHydrationWarning>
                      {item.updated_at ? format(new Date(item.updated_at), 'MMM dd, yyyy') : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CreditAdjustmentDialog email={item.email} />
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/credits/transactions?email=${encodeURIComponent(item.email)}`}>
                            <History className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Coins className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      {recentTxns && recentTxns.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm">Recent Transactions</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/credits/transactions" className="text-xs text-muted-foreground">
                View all →
              </Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold text-primary text-xs uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 font-semibold text-primary text-xs uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 font-semibold text-primary text-xs uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 font-semibold text-primary text-xs uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 font-semibold text-primary text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentTxns.map((txn) => (
                  <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 text-sm text-muted-foreground">{txn.email || '—'}</td>
                    <td className="px-6 py-3">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {(txn.transaction_type || 'unknown').replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        "font-bold tabular-nums",
                        txn.amount >= 0 ? "text-green-600" : "text-red-500"
                      )} suppressHydrationWarning>
                        {txn.amount >= 0 ? '+' : ''}{txn.amount.toLocaleString('en-US')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">
                      {txn.metadata?.reason || '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground" suppressHydrationWarning>
                      {format(new Date(txn.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
