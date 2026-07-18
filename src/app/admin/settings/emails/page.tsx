import { createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit2 } from 'lucide-react'
import { SettingsRowDelete } from '@/components/admin/settings/settings-row-delete'
import { deleteEmailTemplate } from '@/lib/actions/settings-shop'

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  order_confirmation: 'Order Confirmation',
  order_shipped: 'Order Shipped',
  order_delivered: 'Order Delivered',
  order_cancelled: 'Order Cancelled',
  refund_initiated: 'Refund Initiated',
  refund_completed: 'Refund Completed',
  payment_received: 'Payment Received',
  payment_failed: 'Payment Failed',
  download_ready: 'Download Ready',
  customer_notification: 'Customer Notification',
  admin_notification: 'Admin Notification',
}

export default async function EmailTemplatesPage() {
  const admin = createAdminClient()
  const { data: templates } = await admin
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage email templates for different order events.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/settings/emails/new">
            <Plus className="w-4 h-4" />
            New Template
          </Link>
        </Button>
      </div>

      {templates && templates.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Template
                </th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Type
                </th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Subject
                </th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 font-medium">{template.display_name}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {TEMPLATE_TYPE_LABELS[template.template_type] ?? template.template_type}
                  </td>
                  <td className="px-5 py-4 truncate max-w-xs">{template.subject}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        template.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/settings/emails/${template.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </Button>
                      <SettingsRowDelete
                        label={template.display_name}
                        onDelete={deleteEmailTemplate.bind(null, template.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <p className="text-muted-foreground mb-4">No email templates found.</p>
          <Button asChild className="gap-2">
            <Link href="/admin/settings/emails/new">
              <Plus className="w-4 h-4" />
              Create Template
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
