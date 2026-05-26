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
import { savePaymentGateway } from '@/lib/actions/settings-shop'

export interface PaymentGatewayRow {
  id: string
  gateway_name: string
  display_name: string
  description: string | null
  is_active: boolean
  test_mode: boolean
  configuration: Record<string, unknown> | null
}

export function PaymentGatewayForm({ gateway }: { gateway: PaymentGatewayRow }) {
  const router = useRouter()

  const [displayName, setDisplayName] = React.useState(gateway.display_name)
  const [description, setDescription] = React.useState(gateway.description ?? '')
  const [isActive, setIsActive] = React.useState(gateway.is_active)
  const [testMode, setTestMode] = React.useState(gateway.test_mode)
  const [configJson, setConfigJson] = React.useState(
    JSON.stringify(gateway.configuration ?? {}, null, 2)
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    let parsedConfig: Record<string, unknown> = {}
    try {
      parsedConfig = JSON.parse(configJson) as Record<string, unknown>
      if (typeof parsedConfig !== 'object' || Array.isArray(parsedConfig)) {
        setError('Configuration must be a JSON object')
        return
      }
    } catch {
      setError('Configuration must be valid JSON')
      return
    }

    setSubmitting(true)
    const result = await savePaymentGateway(gateway.id, {
      display_name: displayName,
      description: description || undefined,
      is_active: isActive,
      test_mode: testMode,
      configuration: parsedConfig,
    })
    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    router.push('/admin/settings/payments')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/settings/payments">
          <ArrowLeft className="mr-2 size-4" />
          Back to payments
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configure {gateway.display_name}</h1>
        <p className="text-sm text-muted-foreground">
          Gateway: <span className="font-mono">{gateway.gateway_name}</span>. Site-wide API keys
          for Pesapal/PayPal/Stripe are under General → Payments.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="pg-name">Display name</Label>
          <Input
            id="pg-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pg-desc">Description</Label>
          <Textarea
            id="pg-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            disabled={submitting}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <Label>Active at checkout</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} disabled={submitting} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <Label>Test mode</Label>
          <Switch checked={testMode} onCheckedChange={setTestMode} disabled={submitting} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pg-config">Configuration (JSON)</Label>
          <Textarea
            id="pg-config"
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
            rows={8}
            className="font-mono text-xs"
            disabled={submitting}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save gateway'}
          </Button>
          <Button type="button" variant="outline" asChild disabled={submitting}>
            <Link href="/admin/settings/payments">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
