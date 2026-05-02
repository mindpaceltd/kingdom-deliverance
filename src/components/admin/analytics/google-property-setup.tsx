'use client'

import * as React from 'react'
import { Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from './google-connection-card'

interface PropertySetupProps {
  isConnected: boolean
  userId: string
  onConfigSaved: () => void
}

export function GooglePropertySetup({ isConnected, userId, onConfigSaved }: PropertySetupProps) {
  const [step, setStep] = React.useState<'analytics' | 'search-console'>('analytics')
  const [loadingAccounts, setLoadingAccounts] = React.useState(false)
  const [loadingProps, setLoadingProps] = React.useState(false)
  const [loadingSites, setLoadingSites] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const [accounts, setAccounts] = React.useState<any[]>([])
  const [properties, setProperties] = React.useState<any[]>([])
  const [sites, setSites] = React.useState<any[]>([])

  const [selectedAccount, setSelectedAccount] = React.useState('')
  const [selectedProperty, setSelectedProperty] = React.useState('')
  const [selectedSite, setSelectedSite] = React.useState('')

  const [analyticsConfig, setAnalyticsConfig] = React.useState<any>(null)
  const [scConfig, setScConfig] = React.useState<any>(null)

  React.useEffect(() => {
    if (!isConnected) return
    const supabase = createClient()
    supabase.from('analytics_config').select('*').eq('user_id', userId).single().then(({ data }) => setAnalyticsConfig(data))
    supabase.from('search_console_config').select('*').eq('user_id', userId).single().then(({ data }) => setScConfig(data))
  }, [isConnected, userId])

  async function fetchAccounts() {
    setLoadingAccounts(true)
    const res = await fetch('/api/google/analytics/accounts')
    const data = await res.json()
    setAccounts(data.accounts || [])
    setLoadingAccounts(false)
  }

  async function fetchProperties(accountId: string) {
    setLoadingProps(true)
    setSelectedAccount(accountId)
    const res = await fetch(`/api/google/analytics/properties?accountId=${encodeURIComponent(accountId)}`)
    const data = await res.json()
    setProperties(data.properties || [])
    setLoadingProps(false)
  }

  async function fetchSites() {
    setLoadingSites(true)
    const res = await fetch('/api/google/search-console/sites')
    const data = await res.json()
    setSites(data.sites || [])
    setLoadingSites(false)
  }

  async function saveAnalyticsConfig() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('analytics_config').upsert({
      user_id: userId,
      account_id: selectedAccount,
      property_id: selectedProperty,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    setSaving(false)
    setStep('search-console')
    fetchSites()
  }

  async function saveScConfig() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('search_console_config').upsert({
      user_id: userId,
      site_url: selectedSite,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    setSaving(false)
    onConfigSaved()
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* ANALYTICS SETUP */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-bold">GA</div>
            <div>
              <p className="text-sm font-semibold">Google Analytics (GA4)</p>
              <p className="text-xs text-muted-foreground">
                {analyticsConfig?.property_id ? `Property: ${analyticsConfig.property_id}` : 'Select your GA4 property'}
              </p>
            </div>
          </div>
          <StatusBadge status={analyticsConfig?.property_id ? 'connected' : 'needs_config'} />
        </div>

        {step === 'analytics' && (
          <div className="p-5 space-y-4">
            {accounts.length === 0 ? (
              <Button variant="outline" size="sm" onClick={fetchAccounts} disabled={loadingAccounts}>
                {loadingAccounts ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Load Accounts
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-bold uppercase text-muted-foreground">1. Select Account</Label>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {accounts.map((acc: any) => (
                      <button key={acc.name} onClick={() => fetchProperties(acc.name)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-all ${selectedAccount === acc.name ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:bg-muted/50'}`}>
                        {acc.displayName}
                      </button>
                    ))}
                  </div>
                </div>
                {loadingProps && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Loading properties...</div>}
                {properties.length > 0 && (
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground">2. Select Property</Label>
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {properties.map((prop: any) => (
                        <button key={prop.name} onClick={() => setSelectedProperty(prop.name)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-all ${selectedProperty === prop.name ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:bg-muted/50'}`}>
                          {prop.displayName} <span className="text-xs text-muted-foreground ml-1">({prop.name})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProperty && (
                  <Button size="sm" onClick={saveAnalyticsConfig} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                    Save & Continue
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SEARCH CONSOLE SETUP */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold">SC</div>
            <div>
              <p className="text-sm font-semibold">Google Search Console</p>
              <p className="text-xs text-muted-foreground">
                {scConfig?.site_url ? `Site: ${scConfig.site_url}` : 'Select your verified site'}
              </p>
            </div>
          </div>
          <StatusBadge status={scConfig?.site_url ? 'connected' : 'needs_config'} />
        </div>

        {step === 'search-console' && (
          <div className="p-5 space-y-3">
            {sites.length === 0 ? (
              <Button variant="outline" size="sm" onClick={fetchSites} disabled={loadingSites}>
                {loadingSites ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Load Sites
              </Button>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Select Verified Site</Label>
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {sites.map((site: any) => (
                    <button key={site.siteUrl} onClick={() => setSelectedSite(site.siteUrl)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-all ${selectedSite === site.siteUrl ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:bg-muted/50'}`}>
                      {site.siteUrl} <span className="text-xs text-muted-foreground ml-1">({site.permissionLevel})</span>
                    </button>
                  ))}
                </div>
                {selectedSite && (
                  <Button size="sm" onClick={saveScConfig} disabled={saving} className="gap-2 mt-2">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                    Finish Setup
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
