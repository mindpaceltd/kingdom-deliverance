import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Flame, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { updateRequestStatus } from '@/lib/actions/credits'
import { RequestStatusActions } from '@/components/admin/credits/request-status-actions'

export default async function ServiceRequestsPage() {
  const supabase = createClient()
  
  const { data: requests } = await supabase
    .from('fire_service_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fire Service Requests</h1>
          <p className="text-muted-foreground">Manage prayer requests submitted via the Fire Service.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-primary">Customer</th>
                <th className="px-6 py-4 font-semibold text-primary">Prayer Focus</th>
                <th className="px-6 py-4 font-semibold text-primary">Payment</th>
                <th className="px-6 py-4 font-semibold text-primary">Status</th>
                <th className="px-6 py-4 font-semibold text-primary">Date</th>
                <th className="px-6 py-4 font-semibold text-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests && requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-primary">{req.first_name} {req.last_name}</span>
                        <span className="text-xs text-muted-foreground">{req.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {req.prayer_focus_areas?.map((area: string) => (
                          <Badge key={area} variant="outline" className="text-[10px] py-0">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className="w-fit text-[10px] uppercase">
                          {req.payment_method}
                        </Badge>
                        {req.credits_used && (
                          <span className="text-xs text-accent font-medium">-{req.credits_used} credits</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        req.status === 'completed' ? 'success' : 
                        req.status === 'cancelled' ? 'destructive' : 
                        'outline'
                      }>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                      {format(new Date(req.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <RequestStatusActions request={req} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Flame className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    No fire service requests yet.
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
