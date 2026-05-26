'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { saveShippingRate } from '@/lib/actions/settings-shop'

export interface ShippingRateRow {
  id: string
  name: string
  rate_usd: number
  description: string | null
  is_active: boolean
  countries: string[] | null
  estimated_days: string | null
}

interface ShippingRateFormProps {
  initial?: ShippingRateRow
}

function countriesToText(countries: string[] | null | undefined): string {
  return (countries ?? []).join(', ')
}

function textToCountries(text: string): string[] {
  return text
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
}

export function ShippingRateForm({ initial }: ShippingRateFormProps) {
  const router = useRouter()
  const isEdit = Boolean(initial)

  const [name, setName] = React.useState(initial?.name ?? '')
  const [rateUsd, setRateUsd] = React.useState(String(initial?.rate_usd ?? ''))
  const [description, setDescription] = React.useState(initial?.description ?? '')
  const [estimatedDays, setEstimatedDays] = React.useState(initial?.estimated_days ?? '')
  const [countriesText, setCountriesText] = React.useState(
    countriesToText(initial?.countries)
  )
  const [isActive, setIsActive] = React.useState(initial?.is_active ?? true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const rate = parseFloat(rateUsd)
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (Number.isNaN(rate) || rate < 0) {
      setError('Enter a valid rate (USD)')
      return
    }

    setSubmitting(true)
    const result = await saveShippingRate(
      {
        name,
        rate_usd: rate,
        description: description || undefined,
        is_active: isActive,
        countries: textToCountries(countriesText),
        estimated_days: estimatedDays || undefined,
      },
      initial?.id
    )
    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    router.push('/admin/settings/shipping')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/settings/shipping">
          <ArrowLeft className="mr-2 size-4" />
          Back to shipping
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit shipping rate' : 'Add shipping rate'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Rates apply to physical shop orders. Leave countries empty for all regions.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="ship-name">Name</Label>
          <Input
            id="ship-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ship-rate">Rate (USD)</Label>
          <Input
            id="ship-rate"
            type="number"
            min={0}
            step="0.01"
            value={rateUsd}
            onChange={(e) => setRateUsd(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ship-countries">Countries (comma-separated)</Label>
          <Input
            id="ship-countries"
            value={countriesText}
            onChange={(e) => setCountriesText(e.target.value)}
            placeholder="Uganda, Kenya — or leave empty for all"
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ship-days">Estimated delivery</Label>
          <Input
            id="ship-days"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
            placeholder="3-5 days"
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ship-desc">Description</Label>
          <Textarea
            id="ship-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={submitting}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <Label>Active</Label>
            <p className="text-xs text-muted-foreground">Inactive rates are hidden at checkout.</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} disabled={submitting} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create rate'}
          </Button>
          <Button type="button" variant="outline" asChild disabled={submitting}>
            <Link href="/admin/settings/shipping">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
