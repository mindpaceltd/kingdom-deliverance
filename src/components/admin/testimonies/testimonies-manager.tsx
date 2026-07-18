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
  Pencil,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  deleteTestimony,
  updateTestimonyStatus,
  type TestimonyRecord,
} from '@/lib/actions/testimonies'
import { TestimonyFormDialog } from '@/components/admin/testimonies/testimony-form-dialog'

interface TestimoniesManagerProps {
  initialTestimonies: TestimonyRecord[]
}

type TestimonyFilter = 'pending' | 'approved' | 'trash' | 'all'

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TestimonyRecord | null>(null)

  const pendingCount = testimonies.filter((t) => t.status === 'pending').length
  const approvedCount = testimonies.filter((t) => t.status === 'approved').length
  const trashCount = testimonies.filter((t) => t.status === 'rejected').length

  // Submissions start as "pending" (draft-like), admin corrects and then approves.
  // Rejected items are treated as "trash".
  const [filter, setFilter] = useState<TestimonyFilter>('pending')

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(t: TestimonyRecord) {
    setEditing(t)
    setDialogOpen(true)
  }

  function handleSaved(record: TestimonyRecord, mode: 'create' | 'update') {
    if (mode === 'create') {
      setTestimonies((prev) => [record, ...prev])
    } else {
      setTestimonies((prev) => prev.map((t) => (t.id === record.id ? record : t)))
    }
    router.refresh()
  }

  async function handleApprove(id: string) {
    setLoadingId(id)
    const res = await updateTestimonyStatus(id, 'approved')
    setLoadingId(null)
    if ('error' in res) {
      toast.error(res.error)
      return
    }
    setTestimonies((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'approved' as const } : t))
    )
    toast.success('Testimony approved')
    router.refresh()
  }

  async function handleReject(id: string) {
    setLoadingId(id)
    const res = await updateTestimonyStatus(id, 'rejected')
    setLoadingId(null)
    if ('error' in res) {
      toast.error(res.error)
      return
    }
    setTestimonies((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'rejected' as const } : t))
    )
    toast.success('Testimony rejected')
    router.refresh()
  }

  async function handlePending(id: string) {
    setLoadingId(id)
    const res = await updateTestimonyStatus(id, 'pending')
    setLoadingId(null)
    if ('error' in res) {
      toast.error(res.error)
      return
    }
    setTestimonies((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'pending' as const } : t))
    )
    toast.success('Moved to pending')
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this testimony permanently?')) return
    setLoadingId(id)
    const res = await deleteTestimony(id)
    setLoadingId(null)
    if ('error' in res) {
      toast.error(res.error)
      return
    }
    setTestimonies((prev) => prev.filter((t) => t.id !== id))
    toast.success('Testimony deleted')
    router.refresh()
  }

  function filteredTestimonies(): TestimonyRecord[] {
    switch (filter) {
      case 'pending':
        return testimonies.filter((t) => t.status === 'pending')
      case 'approved':
        return testimonies.filter((t) => t.status === 'approved')
      case 'trash':
        return testimonies.filter((t) => t.status === 'rejected')
      case 'all':
      default:
        return testimonies
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">{testimonies.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Pending / Draft</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Published (front-end)</p>
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Trash</p>
            <p className="text-2xl font-bold text-destructive">{trashCount}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add testimony
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Only <strong>Approved</strong> testimonies appear on{' '}
        <a href="/testimonies" className="text-accent underline" target="_blank" rel="noreferrer">
          /testimonies
        </a>{' '}
        and the home page carousel.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({testimonies.length})
        </Button>
        <Button
          type="button"
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          className="bg-transparent"
          onClick={() => setFilter('pending')}
        >
          Draft / Pending ({pendingCount})
        </Button>
        <Button
          type="button"
          variant={filter === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('approved')}
        >
          Approved ({approvedCount})
        </Button>
        <Button
          type="button"
          variant={filter === 'trash' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('trash')}
        >
          Trash ({trashCount})
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <Table className="table-fixed w-full">
          <colgroup>
            <col className="w-[88px]" />
            <col className="w-[min(140px,18%)]" />
            <col />
            <col className="w-[min(110px,14%)]" />
            <col className="w-[56px]" />
            <col className="w-[92px]" />
            <col className="w-[132px]" />
          </colgroup>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="whitespace-normal">Date</TableHead>
              <TableHead className="whitespace-normal">Submitter</TableHead>
              <TableHead className="whitespace-normal">Testimony</TableHead>
              <TableHead className="whitespace-normal">Location</TableHead>
              <TableHead className="whitespace-normal">Media</TableHead>
              <TableHead className="whitespace-normal">Status</TableHead>
              <TableHead className="whitespace-normal text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTestimonies().length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 whitespace-normal text-center text-muted-foreground"
                >
                  {testimonies.length === 0 ? (
                    <>
                      No testimonies yet. Click <strong>Add testimony</strong> or wait for public
                      submissions.
                    </>
                  ) : (
                    <>No testimonies match this filter.</>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredTestimonies().map((t) => {
                const busy = loadingId === t.id
                return (
                  <TableRow key={t.id} className="align-top">
                    <TableCell className="whitespace-normal text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString('en-UG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="max-w-0 whitespace-normal">
                      <div className="truncate font-medium text-primary" title={t.name}>
                        {t.name}
                      </div>
                      {t.phone && (
                        <div className="truncate text-xs text-muted-foreground" title={t.phone}>
                          {t.phone}
                        </div>
                      )}
                      {t.email && (
                        <div className="truncate text-xs text-muted-foreground" title={t.email}>
                          {t.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-0 whitespace-normal">
                      <p
                        className="line-clamp-3 break-words text-sm text-muted-foreground"
                        title={t.testimony}
                      >
                        {t.testimony}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-0 whitespace-normal">
                      {t.location ? (
                        <span
                          className="flex items-start gap-1 text-xs text-muted-foreground"
                          title={t.location}
                        >
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="line-clamp-2 break-words">{t.location}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {t.media_url ? (
                        <a
                          href={t.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-xs text-accent hover:underline"
                          title="Open media"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="sr-only">View</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal">{statusBadge(t.status)}</TableCell>
                    <TableCell className="whitespace-normal text-right">
                      <div className="flex flex-wrap justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={busy}
                          title="Edit"
                          onClick={() => openEdit(t)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {t.status !== 'approved' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-700 hover:bg-green-50"
                            disabled={busy}
                            title="Approve"
                            onClick={() => handleApprove(t.id)}
                          >
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {t.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={busy}
                            title="Move to Draft (pending)"
                            onClick={() => handlePending(t.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {t.status === 'rejected' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-800 hover:bg-amber-50"
                            disabled={busy}
                            title="Restore to Draft (pending)"
                            onClick={() => handlePending(t.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {t.status !== 'rejected' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-700 hover:bg-amber-50"
                            disabled={busy}
                            title="Move to Trash (rejected)"
                            onClick={() => handleReject(t.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-red-50"
                          disabled={busy}
                          title="Delete"
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

      <TestimonyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        testimony={editing}
        onSaved={handleSaved}
      />
    </div>
  )
}
