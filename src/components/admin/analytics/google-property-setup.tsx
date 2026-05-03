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
  const [newPropertyName, setNewPropertyName] = React.useState('')
  const [newSiteUrl, setNewSiteUrl] = React.useState('')
  const [createPropertyLoading, setCreatePropertyLoading] = React.useState(false)
  const [createSiteLoading, setCreateSiteLoading] = React.useState(false)
  const [verifyLoading, setVerifyLoading] = React.useState(false)
  const [createError, setCreateError] = React.useState('')
  const [verificationToken, setVerificationToken] = React.useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = React.useState<'idle' | 'pending' | 'failed' | 'verified'>('idle')

  React.useEffect(() => {
    if (!isConnected) return
    const supabase = createClient()

    fetchAccounts()

    supabase.from('analytics_config').select('*').eq('user_id', userId).single().then(({ data }) => {
      setAnalyticsConfig(data)
      if (data?.account_id) {
        setSelectedAccount(data.account_id)
        fetchProperties(data.account_id)
      }
      if (data?.property_id) {
        setSelectedProperty(data.property_id)
      }
    })

    supabase.from('search_console_config').select('*').eq('user_id', userId).single().then(({ data }) => {
      setScConfig(data)
      if (data?.site_url) {
        setSelectedSite(data.site_url)
      }
    })
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

  async function createProperty() {
    if (!selectedAccount || !newPropertyName.trim()) {
      setCreateError('Choose an account and enter a property name.')
      return
    }

    setCreatePropertyLoading(true)
    setCreateError('')

    try {
      const res = await fetch('/api/google/analytics/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          displayName: newPropertyName.trim(),
        }),
      })
      const result = await res.json()

      if (!res.ok || result.error) {
        throw new Error(result.error || 'Failed to create GA4 property.')
      }

      const property = result.property
      setProperties((prev) => [property, ...prev])
      setSelectedProperty(property.name)
      setAnalyticsConfig({ ...analyticsConfig, account_id: selectedAccount, property_id: property.name })
      setNewPropertyName('')
      await saveAnalyticsConfig()
    } catch (error: any) {
      setCreateError(error?.message || 'Could not create property.')
    } finally {
      setCreatePropertyLoading(false)
    }
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

  function extractVerificationToken(value: any): string | null {
    if (!value) return null
    if (typeof value === 'string') {
      const match = value.match(/content=["']([^"']+)["']/)
      return match?.[1] ?? value
    }
    if (typeof value.token === 'string') {
      return extractVerificationToken(value.token)
    }
    if (typeof value.token === 'object') {
      return extractVerificationToken(value.token?.token)
    }
    return null
  }

  function formatVerificationMetaTag(token: string) {
    const trimmed = token.trim()
    if (trimmed.startsWith('<meta')) {
      return trimmed
    }
    return `<meta name="google-site-verification" content="${trimmed}" />`
  }

  async function addSite() {
    if (!newSiteUrl.trim()) {
      setCreateError('Enter a Search Console site URL to add.')
      return
    }

    setCreateSiteLoading(true)
    setCreateError('')

    try {
      const res = await fetch('/api/google/search-console/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: newSiteUrl.trim(), autoVerify: true }),
      })
      const result = await res.json()

      if (!res.ok || result.error) {
        throw new Error(result.error || 'Failed to add and verify Search Console site.')
      }

      const site = result.site
      const verification = result.verificationResult
      const token = extractVerificationToken(verification?.token)

      setSites((prev) => [site, ...prev])
      setSelectedSite(site.siteUrl)
      setScConfig({ ...scConfig, site_url: site.siteUrl })
      setNewSiteUrl('')

      if (verification?.verified) {
        setVerificationStatus('verified')
        setVerificationToken(null)
        await saveScConfig()
      } else if (token) {
        setVerificationStatus('failed')
        setVerificationToken(token)
        setCreateError(
          `Site added, but verification requires a meta tag. Add this tag to your site and try again: ${formatVerificationMetaTag(token)}`
        )
      } else {
        setVerificationStatus('failed')
        setVerificationToken(null)
        setCreateError(verification?.error || 'Site added, but verification failed.')
      }
    } catch (error: any) {
      setCreateError(error?.message || 'Could not add site.')
    } finally {
      setCreateSiteLoading(false)
    }
  }

  async function retryVerification() {
    if (!selectedSite) {
      setCreateError('Select a site to verify.')
      return
    }

    setVerifyLoading(true)
    setCreateError('')
    setVerificationStatus('pending')

    try {
      const res = await fetch('/api/google/search-console/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: selectedSite }),
      })
      const result = await res.json()

      if (!res.ok || result.error) {
        throw new Error(result.error || 'Verification retry failed.')
      }

      if (result.verified) {
        setVerificationStatus('verified')
        setVerificationToken(null)
        setCreateError('Site verified successfully.')
        await saveScConfig()
      } else {
        const token = extractVerificationToken(result.token)
        if (token) {
          setVerificationStatus('failed')
          setVerificationToken(token)
          setCreateError(
            `Verification still pending. Add this tag to your site and try again: ${formatVerificationMetaTag(token)}`
          )
        } else {
          setVerificationStatus('failed')
          setVerificationToken(null)
          setCreateError('Verification still pending. Please add the meta tag and retry.')
        }
      }
    } catch (error: any) {
      setVerificationStatus('failed')
      setCreateError(error?.message || 'Could not verify site.')
    } finally {
      setVerifyLoading(false)
    }
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
                    <Label className="text-xs font-bold uppercase text-primary mb-2 block">Step 2: Select Property</Label>
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {properties.map((prop: any) => (
                        <button key={prop.name} onClick={() => setSelectedProperty(prop.name)}
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-xl border transition-all ${selectedProperty === prop.name ? 'border-accent bg-accent/5 ring-1 ring-accent/20 font-bold' : 'border-border hover:bg-muted/50'}`}>
                          <div className="flex items-center justify-between">
                             <span>{prop.displayName}</span>
                             <span className="text-[10px] opacity-50 font-mono">({prop.name.replace('properties/', '')})</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-border p-4 bg-muted/5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Create New GA4 Property</Label>
                  <div className="mt-3 space-y-3">
                    <input
                      value={newPropertyName}
                      onChange={(e) => setNewPropertyName(e.target.value)}
                      placeholder="My Church Website"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <Button size="sm" onClick={createProperty} disabled={createPropertyLoading || !selectedAccount} className="gap-2">
                      {createPropertyLoading ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                      Create Property
                    </Button>
                    <p className="text-xs text-muted-foreground">Creates a new GA4 property under the selected Google Analytics account.</p>
                    {createError && <p className="text-xs text-destructive">{createError}</p>}
                  </div>
                </div>
                {selectedProperty && (
                  <div className="pt-2">
                    <Label className="text-xs font-bold uppercase text-primary mb-3 block">Step 3: Confirm Configuration</Label>
                    <Button 
                      size="sm" 
                      onClick={saveAnalyticsConfig} 
                      disabled={saving} 
                      className="gap-2 rounded-xl bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 animate-pulse-subtle w-full sm:w-auto"
                    >
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircleIcon className="size-4" />}
                      Save & Continue to Search Console
                    </Button>
                  </div>
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
                  <div className="pt-2">
                    <Label className="text-xs font-bold uppercase text-primary mb-3 block">Step 2: Confirm Site</Label>
                    <Button 
                      size="sm" 
                      onClick={saveScConfig} 
                      disabled={saving} 
                      className="gap-2 rounded-xl bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 animate-pulse-subtle w-full sm:w-auto"
                    >
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircleIcon className="size-4" />}
                      Complete Setup & View Analytics
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-border p-4 bg-muted/5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Add New Search Console Site</Label>
              <div className="mt-3 space-y-3">
                <input
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  placeholder="https://kdcuganda.org"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <Button size="sm" onClick={addSite} disabled={createSiteLoading} className="gap-2">
                  {createSiteLoading ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                  Add Site and Verify
                </Button>
                <p className="text-xs text-muted-foreground">Adds the site and attempts automatic Search Console ownership verification.</p>
                {createError && <p className="text-xs text-destructive">{createError}</p>}
              </div>
              {(verificationStatus === 'failed' || verificationStatus === 'pending') && verificationToken && (
                <div className="mt-4 rounded-xl border border-border p-4 bg-muted/10">
                  <p className="text-sm font-semibold">Retry Site Verification</p>
                  <p className="text-xs text-muted-foreground">
                    Add this meta tag to the site&apos;s homepage and click retry.
                  </p>
                  <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-muted-foreground break-words">
                    {`<meta name="google-site-verification" content="${verificationToken}" />`}
                  </div>
                  <Button size="sm" onClick={retryVerification} disabled={verifyLoading} className="gap-2 mt-3">
                    {verifyLoading ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                    Retry Verification
                  </Button>
                </div>
              )}
            </div>
            {verificationStatus === 'verified' && (
              <div className="rounded-xl border border-border p-4 bg-muted/10 text-sm text-foreground">
                Site verified successfully. Finish setup by selecting the site above if needed.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
