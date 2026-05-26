'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  Trash2,
  ExternalLink,
  Loader2,
  XCircle,
  MapPin,
} from 'lucide-react'
import {
  deleteTestimony,
  updateTestimonyStatus,
  type TestimonyRecord,
} from '@/lib/actions/testimonies'

interface TestimoniesManagerProps {
  initialTestimonies: TestimonyRecord[]
}

function statusBadge(status: string) {
  switch (status) {
    case 'approved':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Approved
        </Badge>
      )
    case 'rejected':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Rejected
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Pending
        </Badge>
      )
  }
}

export function TestimoniesManager({ initialTestimonies }: TestimoniesManagerProps) {
  const router = useRouter()
  const [testimonies, setTestimonies] = useState(initialTestimonies)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const pendingCount = testimonies.filter((t) => t.status === 'pending').length
  const approvedCount = testimonies.filter((t) => t.status === 'approved').length

  async function handleApprove(id: string) {
    setLoadingId(id)
    const res = await updateTestimonyStatus(id, 'approved')
    setLoadingId(null)
    if ('error' in res) {
      alert(res.error)
      return
    }
    setTestimonies((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'approved' as const } : t))
    )
    router.refresh()
  }

  async function handleReject(id: string) {
    setLoadingId(id)
    const res = await updateTestimonyStatus(id, 'rejected')
    setLoadingId(null)
    if ('error' in res) {
      alert(res.error)
      return
    }
    setTestimonies((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'rejected' as const } : t))
    )
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this testimony permanently?')) return
    setLoadingId(id)
    const res = await deleteTestimony(id)
    setLoadingId(null)
    if ('error' in res) {
      alert(res.error)
      return
    }
    setTestimonies((prev) => prev.filter((t) => t.id !== id))
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-primary">{testimonies.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Pending review</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Published (front-end)</p>
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Only <strong>Approved</strong> testimonies appear on{' '}
        <a href="/testimonies" className="text-accent underline" target="_blank" rel="noreferrer">
          /testimonies
        </a>{' '}
        and the home page carousel. Fields match the public submit form: name, email, phone,
        location, testimony, and optional media.
      </p>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Submitter</TableHead>
              <TableHead className="min-w-[220px]">Testimony</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Media</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testimonies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No testimonies yet. Run the latest database migration to seed sample stories,
                  or wait for submissions from the public form.
                </TableCell>
              </TableRow>
            ) : (
              testimonies.map((t) => {
                const busy = loadingId === t.id
                return (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(t.created_at).toLocaleDateString('en-UG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-primary">{t.name}</div>
                      {t.phone && (
                        <div className="text-xs text-muted-foreground">{t.phone}</div>
                      )}
                      {t.email && (
                        <div className="text-xs text-muted-foreground">{t.email}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p
                        className="line-clamp-4 text-sm text-muted-foreground"
                        title={t.testimony}
                      >
                        {t.testimony}
                      </p>
                    </TableCell>
                    <TableCell>
                      {t.location ? (
                        <span className="flex items-start gap-1 text-xs text-muted-foreground">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          {t.location}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.media_url ? (
                        <a
                          href={t.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(t.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {t.status !== 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-green-200 text-green-700 hover:bg-green-50"
                            disabled={busy}
                            onClick={() => handleApprove(t.id)}
                          >
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="mr-1 h-4 w-4" />
                                Approve
                              </>
                            )}
                          </Button>
                        )}
                        {t.status !== 'rejected' && t.status !== 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={busy}
                            onClick={() => handleReject(t.id)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-red-50"
                          disabled={busy}
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
