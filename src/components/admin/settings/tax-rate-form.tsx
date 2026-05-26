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
import { saveTaxRate } from '@/lib/actions/settings-shop'

export interface TaxRateRow {
  id: string
  name: string
  tax_rate: number
  description: string | null
  is_active: boolean
  apply_to_shipping: boolean
  countries: string[] | null
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

export function TaxRateForm({ initial }: { initial?: TaxRateRow }) {
  const router = useRouter()
  const isEdit = Boolean(initial)

  const [name, setName] = React.useState(initial?.name ?? '')
  const [taxRate, setTaxRate] = React.useState(String(initial?.tax_rate ?? ''))
  const [description, setDescription] = React.useState(initial?.description ?? '')
  const [countriesText, setCountriesText] = React.useState(
    countriesToText(initial?.countries)
  )
  const [applyToShipping, setApplyToShipping] = React.useState(
    initial?.apply_to_shipping ?? false
  )
  const [isActive, setIsActive] = React.useState(initial?.is_active ?? true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const rate = parseFloat(taxRate)
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      setError('Tax rate must be between 0 and 100')
      return
    }

    setSubmitting(true)
    const result = await saveTaxRate(
      {
        name,
        tax_rate: rate,
        description: description || undefined,
        is_active: isActive,
        apply_to_shipping: applyToShipping,
        countries: textToCountries(countriesText),
      },
      initial?.id
    )
    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    router.push('/admin/settings/taxes')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/settings/taxes">
          <ArrowLeft className="mr-2 size-4" />
          Back to taxes
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit tax rate' : 'Add tax rate'}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="tax-name">Name</Label>
          <Input
            id="tax-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tax-rate">Tax rate (%)</Label>
          <Input
            id="tax-rate"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tax-countries">Countries (comma-separated)</Label>
          <Input
            id="tax-countries"
            value={countriesText}
            onChange={(e) => setCountriesText(e.target.value)}
            placeholder="Uganda — or empty for all"
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tax-desc">Description</Label>
          <Textarea
            id="tax-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={submitting}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <Label>Apply to shipping</Label>
            <p className="text-xs text-muted-foreground">Include shipping in the tax base.</p>
          </div>
          <Switch
            checked={applyToShipping}
            onCheckedChange={setApplyToShipping}
            disabled={submitting}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <Label>Active</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} disabled={submitting} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create tax rate'}
          </Button>
          <Button type="button" variant="outline" asChild disabled={submitting}>
            <Link href="/admin/settings/taxes">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
