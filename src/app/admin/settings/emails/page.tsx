import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit2, Copy } from 'lucide-react'
import { SettingsTabs } from '@/components/admin/settings/settings-tabs'

export default async function EmailTemplatesPage() {
  const supabase = createClient()

  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false })

  const templateTypes = [
    { value: 'order_confirmation', label: 'Order Confirmation' },
    { value: 'order_shipped', label: 'Order Shipped' },
    { value: 'order_delivered', label: 'Order Delivered' },
    { value: 'order_cancelled', label: 'Order Cancelled' },
    { value: 'refund_initiated', label: 'Refund Initiated' },
    { value: 'refund_completed', label: 'Refund Completed' },
    { value: 'payment_received', label: 'Payment Received' },
    { value: 'payment_failed', label: 'Payment Failed' },
    { value: 'download_ready', label: 'Download Ready' },
  ]

  const getTypeLabel = (type: string) => {
    return templateTypes.find(t => t.value === type)?.label || type
  }

  return (
    <div>
      <SettingsTabs />
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage email templates for different order events.</p>
        </div>
        <Button asChild className="gap-2 bg-[#1e3a5f] hover:bg-[#162d4a]">
          <Link href="/admin/settings/emails/new">
            <Plus className="w-4 h-4" />
            New Template
          </Link>
        </Button>
      </div>

      {templates && templates.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Template</th>
                <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Type</th>
                <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Subject</th>
                <th className="text-left px-5 py-3 font-bold text-gray-600 text-xs uppercase">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map((template: any) => (
                <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-gray-900">{template.display_name}</td>
                  <td className="px-5 py-4 text-gray-700">{getTypeLabel(template.template_type)}</td>
                  <td className="px-5 py-4 text-gray-700 truncate max-w-xs">{template.subject}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/settings/emails/${template.id}`}>
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <p className="text-gray-500 mb-4">No email templates found.</p>
          <Button asChild className="gap-2 bg-[#1e3a5f] hover:bg-[#162d4a]">
            <Link href="/admin/settings/emails/new">
              <Plus className="w-4 h-4" />
              Create Template
            </Link>
          </Button>
        </div>
      )}
      </div>
    </div>
  )
}
