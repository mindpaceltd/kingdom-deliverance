import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react'

export default async function TransactionsPage({ searchParams }: { searchParams: { email?: string } }) {
  const supabase = createAdminClient()
  
  let query = supabase
    .from('credit_transactions')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchParams.email) {
    query = query.eq('email', searchParams.email)
  }

  const { data: transactions } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credit Transactions</h1>
          <p className="text-muted-foreground">
            {searchParams.email ? `Showing history for ${searchParams.email}` : 'Complete history of credit movements.'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-primary">User</th>
                <th className="px-6 py-4 font-semibold text-primary">Type</th>
                <th className="px-6 py-4 font-semibold text-primary">Amount</th>
                <th className="px-6 py-4 font-semibold text-primary">Reason/Ref</th>
                <th className="px-6 py-4 font-semibold text-primary">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-primary">{tx.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tx.amount > 0 ? (
                          <ArrowUpCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="capitalize">{tx.transaction_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={tx.amount > 0 ? 'text-green-500 font-bold' : 'text-orange-500 font-bold'}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2 max-w-xs">
                        <Info className="h-3 w-3 shrink-0" />
                        <span className="truncate text-xs">
                          {tx.reference_id || tx.metadata?.reason || 'System adjustment'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                      {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No transactions found.
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
