'use client'

import * as React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Search,
  Heart,
  Eye,
  Filter,
  UserX,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { updateDonationStatus } from '@/lib/actions/donations-admin'
import type { DonationWithTransactions } from '@/lib/actions/donations-admin'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'failed'
type AnonFilter = 'all' | 'anonymous' | 'named'

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: currency || 'UGX',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`
  }
}

function donorLabel(d: DonationWithTransactions) {
  if (d.is_anonymous) return 'Anonymous donor'
  return d.donor_name || d.donor_email || 'Unknown donor'
}

function statusBadge(status: string) {
  if (status === 'confirmed') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        <CheckCircle2 className="mr-1 size-3" />
        Confirmed
      </Badge>
    )
  }
  if (status === 'failed') {
    return (
      <Badge variant="destructive">
        <XCircle className="mr-1 size-3" />
        Failed
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      <Clock className="mr-1 size-3" />
      Pending
    </Badge>
  )
}

export function DonationsManager({
  initialDonations,
}: {
  initialDonations: DonationWithTransactions[]
}) {
  const [donations, setDonations] = React.useState(initialDonations)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const [anonFilter, setAnonFilter] = React.useState<AnonFilter>('all')
  const [selected, setSelected] = React.useState<DonationWithTransactions | null>(null)
  const [updating, setUpdating] = React.useState(false)

  const stats = React.useMemo(() => {
    const confirmed = donations.filter((d) => d.status === 'confirmed')
    const pending = donations.filter((d) => d.status === 'pending')
    const anonymous = donations.filter((d) => d.is_anonymous)
    const confirmedTotal = confirmed.reduce((sum, d) => sum + Number(d.amount), 0)
    return {
      total: donations.length,
      confirmed: confirmed.length,
      pending: pending.length,
      anonymous: anonymous.length,
      confirmedTotal,
    }
  }, [donations])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return donations.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      if (anonFilter === 'anonymous' && !d.is_anonymous) return false
      if (anonFilter === 'named' && d.is_anonymous) return false
      if (!q) return true

      const haystack = [
        d.id,
        d.donor_name,
        d.donor_email,
        d.reference,
        d.notes,
        d.currency,
        String(d.amount),
        ...(d.transactions?.map((t) => t.reference) ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [donations, search, statusFilter, anonFilter])

  async function setStatus(id: string, status: 'pending' | 'confirmed' | 'failed') {
    setUpdating(true)
    const result = await updateDonationStatus(id, status)
    setUpdating(false)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)))
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev))
    toast.success(`Marked as ${status}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Donations</h1>
          <p className="text-muted-foreground">
            Find every gift — including anonymous online donations via{' '}
            <Link href="/donations" className="text-primary hover:underline" target="_blank">
              Pesapal
              <ExternalLink className="ml-0.5 inline size-3" />
            </Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total records</p>
          <p className="mt-1 text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirmed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.confirmed}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Anonymous</p>
          <p className="mt-1 text-2xl font-bold">{stats.anonymous}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, ID, reference, amount, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="mr-2 size-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={anonFilter} onValueChange={(v) => setAnonFilter(v as AnonFilter)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Donor type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All donors</SelectItem>
            <SelectItem value="anonymous">Anonymous only</SelectItem>
            <SelectItem value="named">Named only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Donor</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length ? (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          {d.is_anonymous ? (
                            <UserX className="size-3.5 text-muted-foreground" aria-hidden />
                          ) : null}
                          {donorLabel(d)}
                        </span>
                        {!d.is_anonymous && d.donor_email ? (
                          <span className="text-xs text-muted-foreground">{d.donor_email}</span>
                        ) : d.is_anonymous ? (
                          <span className="text-xs text-muted-foreground">Identity hidden from public</span>
                        ) : null}
                        <span className="font-mono text-[10px] text-muted-foreground">#{d.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatAmount(Number(d.amount), d.currency)}</td>
                    <td className="px-4 py-3">{statusBadge(d.status)}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{d.method || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(d.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(d)}>
                        <Eye className="mr-1 size-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <Heart className="mx-auto mb-3 size-10 opacity-20" />
                    {donations.length === 0
                      ? 'No donations recorded yet.'
                      : 'No donations match your search or filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>Donation details</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Donor</p>
                  <p className="font-semibold">{donorLabel(selected)}</p>
                  {selected.is_anonymous ? (
                    <p className="text-xs text-muted-foreground">
                      Marked anonymous on the public form. Use the donation ID and payment reference to reconcile
                      with Pesapal.
                    </p>
                  ) : null}
                  {!selected.is_anonymous && selected.donor_name ? (
                    <p>{selected.donor_name}</p>
                  ) : null}
                  {!selected.is_anonymous && selected.donor_email ? (
                    <p className="text-muted-foreground">{selected.donor_email}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-bold">{formatAmount(Number(selected.amount), selected.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1">{statusBadge(selected.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Method</p>
                    <p className="capitalize">{selected.method || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p>{format(new Date(selected.created_at), 'PPpp')}</p>
                  </div>
                </div>

                {selected.reference ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Reference</p>
                    <p className="font-mono text-xs">{selected.reference}</p>
                  </div>
                ) : null}

                {selected.notes ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="whitespace-pre-wrap">{selected.notes}</p>
                  </div>
                ) : null}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment attempts
                  </p>
                  {selected.transactions?.length ? (
                    <ul className="space-y-2">
                      {selected.transactions.map((tx) => (
                        <li key={tx.id} className="rounded-lg border p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold capitalize">{tx.gateway}</span>
                            <Badge variant="outline">{tx.status}</Badge>
                          </div>
                          <p className="mt-1 font-mono">{tx.reference}</p>
                          <p className="text-muted-foreground">
                            {formatAmount(Number(tx.amount), tx.currency)} ·{' '}
                            {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No gateway transaction logged yet.</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Update status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(['pending', 'confirmed', 'failed'] as const).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={selected.status === s ? 'default' : 'outline'}
                        disabled={updating || selected.status === s}
                        onClick={() => setStatus(selected.id, s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>

                <p className="font-mono text-[10px] text-muted-foreground">ID: {selected.id}</p>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
