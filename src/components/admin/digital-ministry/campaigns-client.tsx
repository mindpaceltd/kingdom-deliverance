'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { archiveCampaign, upsertCampaign } from '@/lib/digital-ministry/ops'
import { Loader2 } from 'lucide-react'

export function CampaignsClient({
  campaigns,
}: {
  campaigns: Array<{
    id: string
    name: string
    description: string | null
    status: string
    start_date: string | null
    end_date: string | null
  }>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <DmCard className="space-y-3 p-5">
        <p className="text-sm font-semibold">New campaign</p>
        <Input placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea
          placeholder="Description / goals"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button
          size="sm"
          disabled={pending || !name.trim()}
          onClick={() =>
            startTransition(async () => {
              setError(null)
              const r = await upsertCampaign({
                name,
                description,
                status: 'active',
                startDate: startDate || null,
                endDate: endDate || null,
              })
              if (r.error) setError(r.error)
              else {
                setName('')
                setDescription('')
                router.refresh()
              }
            })
          }
        >
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
          Create
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </DmCard>

      <div className="space-y-2">
        {campaigns.map((c) => (
          <DmCard key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {c.status}
                {c.start_date ? ` · ${c.start_date}` : ''}
                {c.end_date ? ` → ${c.end_date}` : ''}
              </p>
              {c.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              ) : null}
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await archiveCampaign(c.id)
                  router.refresh()
                })
              }
            >
              Archive
            </Button>
          </DmCard>
        ))}
      </div>
    </div>
  )
}
