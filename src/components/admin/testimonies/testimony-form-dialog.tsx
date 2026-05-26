'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createTestimony,
  updateTestimony,
  type TestimonyInput,
  type TestimonyRecord,
} from '@/lib/actions/testimonies'

type FormState = {
  name: string
  email: string
  phone: string
  location: string
  testimony: string
  media_url: string
  status: TestimonyInput['status']
}

const emptyForm = (): FormState => ({
  name: '',
  email: '',
  phone: '',
  location: '',
  testimony: '',
  media_url: '',
  status: 'pending',
})

function recordToForm(t: TestimonyRecord): FormState {
  return {
    name: t.name,
    email: t.email ?? '',
    phone: t.phone ?? '',
    location: t.location ?? '',
    testimony: t.testimony,
    media_url: t.media_url ?? '',
    status: t.status,
  }
}

interface TestimonyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  testimony?: TestimonyRecord | null
  onSaved: (record: TestimonyRecord, mode: 'create' | 'update') => void
}

export function TestimonyFormDialog({
  open,
  onOpenChange,
  testimony,
  onSaved,
}: TestimonyFormDialogProps) {
  const isEdit = Boolean(testimony)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!open) return
    setForm(testimony ? recordToForm(testimony) : emptyForm())
  }, [open, testimony])

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload: TestimonyInput = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      location: form.location || null,
      testimony: form.testimony,
      media_url: form.media_url || null,
      media_type: form.media_url ? 'url' : null,
      status: form.status,
    }

    const res = isEdit && testimony
      ? await updateTestimony(testimony.id, payload)
      : await createTestimony(payload)

    setLoading(false)

    if ('error' in res) {
      toast.error(res.error)
      return
    }

    toast.success(isEdit ? 'Testimony updated' : 'Testimony created')
    onSaved(res.data, isEdit ? 'update' : 'create')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit testimony' : 'Add testimony'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update fields shown on the public site when status is Approved.'
              : 'Create a testimony manually (e.g. from phone or in-person).'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="t-name">Name *</Label>
            <Input
              id="t-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="t-email">Email</Label>
              <Input
                id="t-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-phone">Phone</Label>
              <Input
                id="t-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-location">Location</Label>
            <Input
              id="t-location"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Kampala, Uganda"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-body">Testimony *</Label>
            <Textarea
              id="t-body"
              rows={5}
              value={form.testimony}
              onChange={(e) => set('testimony', e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-media">Media URL (optional)</Label>
            <Input
              id="t-media"
              type="url"
              value={form.media_url}
              onChange={(e) => set('media_url', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set('status', v as FormState['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved (published)</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create testimony'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
