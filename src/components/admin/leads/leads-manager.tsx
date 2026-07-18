'use client'

import Link from 'next/link'
import { UserPlus, Mail, Phone, MessageCircle, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatAdminDate } from '@/lib/format-admin-date'
import type { Lead } from '@/lib/actions/leads'

function sourceLabel(source: string) {
  if (source === 'live_support') return 'Live Support'
  return source.replace(/_/g, ' ')
}

export function LeadsManager({ leads }: { leads: Lead[] }) {
  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserPlus className="size-7 text-primary" />
          Leads
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Contacts captured when visitors start Live Support chat (name + email or phone).
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-primary">Name</th>
                <th className="px-6 py-4 font-semibold text-primary">Contact</th>
                <th className="px-6 py-4 font-semibold text-primary">Source</th>
                <th className="px-6 py-4 font-semibold text-primary">Captured</th>
                <th className="px-6 py-4 font-semibold text-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No leads yet. They appear when someone starts Live Support with their details.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">{lead.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                          >
                            <Mail className="size-3.5" />
                            {lead.email}
                          </a>
                        )}
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone.replace(/\s/g, '')}`}
                            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                          >
                            <Phone className="size-3.5" />
                            {lead.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {sourceLabel(lead.source)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap" suppressHydrationWarning>
                      {formatAdminDate(lead.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {lead.support_conversation_id ? (
                        <Link
                          href={`/admin/support`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <MessageCircle className="size-3.5" />
                          Open chat
                          <ExternalLink className="size-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
