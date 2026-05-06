import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Coins, Plus, History, Search } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { CreditAdjustmentDialog } from '@/components/admin/credits/adjustment-dialog'
import { cn } from '@/lib/utils'

export default async function AdminCreditsPage() {
  const supabase = createClient()
  
  // Get all profiles and their associated credits
  const { data: users } = await supabase
    .from('profiles')
    .select(`
      email,
      name,
      user_credits (
        balance,
        lifetime_earned,
        lifetime_spent,
        updated_at
      )
    `)
    .order('name')

  // Map to a consistent structure
  const items = (users || []).map(u => {
    const credits = (u.user_credits as any)?.[0] || {
      balance: 0,
      lifetime_earned: 0,
      lifetime_spent: 0,
      updated_at: u.created_at || new Date().toISOString()
    }
    return {
      email: u.email,
      name: u.name,
      ...credits
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Credit Balances</h1>
          <p className="text-muted-foreground">Monitor and manage user credit accounts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Credits in System</p>
              <p className="text-2xl font-bold">
                {items.reduce((acc, curr) => acc + curr.balance, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Wallets</p>
              <p className="text-2xl font-bold">{items.filter(i => i.balance > 0 || i.lifetime_earned > 0).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-primary">User Email</th>
                <th className="px-6 py-4 font-semibold text-primary">Current Balance</th>
                <th className="px-6 py-4 font-semibold text-primary">Total Earned</th>
                <th className="px-6 py-4 font-semibold text-primary">Total Spent</th>
                <th className="px-6 py-4 font-semibold text-primary">Last Updated</th>
                <th className="px-6 py-4 font-semibold text-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.email} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-primary">{item.name || 'Untitled'}</span>
                        <span className="text-xs text-muted-foreground">{item.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Coins className="h-3 w-3 text-accent" />
                        <span className={cn(
                          "font-bold",
                          item.balance > 0 ? "text-accent" : "text-muted-foreground/50"
                        )}>
                          {item.balance.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {item.lifetime_earned.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {item.lifetime_spent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {format(new Date(item.updated_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CreditAdjustmentDialog email={item.email} />
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/credits/transactions?email=${item.email}`}>
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
                    No credit accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
