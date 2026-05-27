'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveShippingRate } from '@/lib/actions/settings-shop'
import { countries } from '@/lib/countries'
import {
  displayAmountToUsd,
  usdToDisplayAmount,
  type ShopAdminCurrency,
} from '@/lib/shop/currency'
import { cn } from '@/lib/utils'

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

export function ShippingRateForm({ initial }: ShippingRateFormProps) {
  const router = useRouter()
  const isEdit = Boolean(initial)

  const [name, setName] = React.useState(initial?.name ?? '')
  const [currency, setCurrency] = React.useState<ShopAdminCurrency>('UGX')
  const [rateInput, setRateInput] = React.useState(
    String(usdToDisplayAmount(Number(initial?.rate_usd ?? 0), 'UGX'))
  )
  const [description, setDescription] = React.useState(initial?.description ?? '')
  const [estimatedDays, setEstimatedDays] = React.useState(initial?.estimated_days ?? '')
  const [allCountries, setAllCountries] = React.useState(
    !initial?.countries || initial.countries.length === 0
  )
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>(
    initial?.countries ?? []
  )
  const [isActive, setIsActive] = React.useState(initial?.is_active ?? true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [countrySelectKey, setCountrySelectKey] = React.useState(0)

  function handleCurrencyChange(next: ShopAdminCurrency) {
    const num = parseFloat(rateInput)
    if (!Number.isNaN(num) && num >= 0) {
      const asUsd = displayAmountToUsd(num, currency)
      setRateInput(String(usdToDisplayAmount(asUsd, next)))
    }
    setCurrency(next)
  }

  function addCountry(countryName: string) {
    if (!countryName || selectedCountries.includes(countryName)) return
    setSelectedCountries((prev) => [...prev, countryName])
    setCountrySelectKey((k) => k + 1)
  }

  function removeCountry(countryName: string) {
    setSelectedCountries((prev) => prev.filter((c) => c !== countryName))
  }

  const availableToAdd = countries.filter((c) => !selectedCountries.includes(c.name))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const rateDisplay = parseFloat(rateInput)
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (Number.isNaN(rateDisplay) || rateDisplay < 0) {
      setError(`Enter a valid rate (${currency})`)
      return
    }
    if (!allCountries && selectedCountries.length === 0) {
      setError('Select at least one country, or choose “All countries”.')
      return
    }

    const rate_usd = displayAmountToUsd(rateDisplay, currency)

    setSubmitting(true)
    const result = await saveShippingRate(
      {
        name,
        rate_usd,
        description: description || undefined,
        is_active: isActive,
        countries: allCountries ? [] : selectedCountries,
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
          Rates are saved in USD and shown in UGX at checkout using the shop exchange rate.
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

        <div className="space-y-2">
          <Label>Rate</Label>
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-bold transition-all',
                  currency === 'USD' ? 'bg-white shadow text-primary' : 'text-muted-foreground'
                )}
                onClick={() => handleCurrencyChange('USD')}
                disabled={submitting}
              >
                USD
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-bold transition-all',
                  currency === 'UGX' ? 'bg-white shadow text-primary' : 'text-muted-foreground'
                )}
                onClick={() => handleCurrencyChange('UGX')}
                disabled={submitting}
              >
                UGX
              </button>
            </div>
            <Input
              id="ship-rate"
              type="number"
              min={0}
              step={currency === 'UGX' ? 1 : 0.01}
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              required
              disabled={submitting}
              className="flex-1"
              placeholder={currency === 'UGX' ? '19000' : '5.00'}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the shipping fee in {currency}. Stored as USD for checkout currency conversion.
          </p>
        </div>

        <div className="space-y-3">
          <Label>Countries</Label>
          <div className="flex items-center gap-2 rounded-lg border border-border p-3">
            <Checkbox
              id="ship-all-countries"
              checked={allCountries}
              onChange={(e) => {
                setAllCountries(e.target.checked)
                if (e.target.checked) setSelectedCountries([])
              }}
              disabled={submitting}
            />
            <Label htmlFor="ship-all-countries" className="cursor-pointer font-normal">
              All countries (worldwide)
            </Label>
          </div>

          {!allCountries && (
            <div className="space-y-2">
              <Select
                key={countrySelectKey}
                onValueChange={(value) => addCountry(value)}
                disabled={submitting || availableToAdd.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add country…" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((c) => (
                    <SelectItem key={c.code} value={c.name}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCountries.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedCountries.map((countryName) => {
                    const meta = countries.find((c) => c.name === countryName)
                    return (
                      <Badge
                        key={countryName}
                        variant="secondary"
                        className="gap-1 pr-1 font-normal"
                      >
                        {meta?.flag} {countryName}
                        <button
                          type="button"
                          className="rounded-full p-0.5 hover:bg-muted"
                          onClick={() => removeCountry(countryName)}
                          aria-label={`Remove ${countryName}`}
                          disabled={submitting}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Choose one or more countries from the dropdown.
                </p>
              )}
            </div>
          )}
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
