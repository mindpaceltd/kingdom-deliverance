'use client'

import * as React from 'react'
import { 
  SaveIcon, 
  GlobeIcon, 
  PaletteIcon, 
  MailIcon, 
  CreditCardIcon, 
  SearchIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ImageIcon,
  AlertTriangleIcon,
  PlusIcon,
  Trash2Icon,
  Share2Icon,
  ZapIcon,
  QrCodeIcon,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveSettings, registerPesapalIPNAction, testSMTPAction } from '@/lib/actions/settings'
import { uploadMediaAction } from '@/lib/actions/media'
import type { SiteSetting } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  parseQrCodes,
  parseSocialLinks,
  parseStringArray,
} from '@/lib/settings-json'

// ---------------------------------------------------------------------------
// Settings Categories
// ---------------------------------------------------------------------------

type Category = 'general' | 'branding' | 'seo' | 'email' | 'payments' | 'integrations' | 'social' | 'qrcodes'

const CATEGORIES: { id: Category; label: string; icon: any }[] = [
  { id: 'general', label: 'General', icon: GlobeIcon },
  { id: 'branding', label: 'Branding', icon: PaletteIcon },
  { id: 'seo', label: 'SEO Settings', icon: SearchIcon },
  { id: 'email', label: 'Email (SMTP)', icon: MailIcon },
  { id: 'payments', label: 'Payments', icon: CreditCardIcon },
  { id: 'integrations', label: 'Integrations', icon: ZapIcon },
  { id: 'social', label: 'Social & Links', icon: Share2Icon },
  { id: 'qrcodes', label: 'QR Codes', icon: QrCodeIcon },
]

// ---------------------------------------------------------------------------
// Branding Image Field
// ---------------------------------------------------------------------------

interface BrandingImageFieldProps {
  label: string
  description: string
  value: string
  onUpload: (url: string) => void
  onClear: () => void
  aspectRatio?: 'video' | 'square'
}

function BrandingImageField({ label, description, value, onUpload, onClear, aspectRatio = 'video' }: BrandingImageFieldProps) {
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'media')

      // Upload and create record via our generic R2 Server Action
      const result = await uploadMediaAction(formData)
      if ('error' in result) {
        throw new Error(result.error)
      }

      onUpload(result.url)
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 items-start">
      <div className="space-y-3">
        <Label className="text-base font-bold">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="flex gap-2">
           <Button 
             type="button" 
             variant="outline" 
             size="sm" 
             disabled={uploading}
             onClick={() => fileInputRef.current?.click()}
           >
             {uploading ? 'Uploading...' : (value ? 'Change Image' : 'Upload Image')}
           </Button>
           {value && (
             <Button type="button" variant="ghost" size="sm" onClick={onClear} className="text-destructive">
                Remove
             </Button>
           )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
        {value && <p className="text-[10px] text-muted-foreground truncate max-w-full italic">{value}</p>}
      </div>
      <div className={cn(
        "relative rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/20 overflow-hidden shadow-inner",
        aspectRatio === 'video' ? "aspect-video" : "size-24"
      )}>
        {value ? (
          <img src={value} alt={label} className="max-h-full object-contain" />
        ) : (
          <ImageIcon className={cn("opacity-20", aspectRatio === 'video' ? "size-8" : "size-6")} />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
             <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SettingsForm
// ---------------------------------------------------------------------------

interface SettingsFormProps {
  initialSettings: SiteSetting[]
}

// ---------------------------------------------------------------------------
// RegisterIPNButton — auto-registers Pesapal IPN and fills in the ID
// ---------------------------------------------------------------------------

function RegisterIPNButton({ onSuccess }: { onSuccess: (id: string) => void }) {
  const [loading, setLoading] = React.useState(false)
  const [status, setStatus] = React.useState<'idle' | 'ok' | 'err'>('idle')
  const [msg, setMsg] = React.useState('')

  async function handleRegister() {
    setLoading(true)
    setStatus('idle')
    setMsg('')
    const result = await registerPesapalIPNAction()
    setLoading(false)
    if ('error' in result) {
      setStatus('err')
      setMsg(result.error)
    } else {
      setStatus('ok')
      setMsg(`Registered! ID: ${result.ipnId}`)
      onSuccess(result.ipnId)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRegister}
        disabled={loading}
        className="shrink-0 h-9 text-xs whitespace-nowrap"
      >
        {loading ? 'Registering…' : 'Auto-Register'}
      </Button>
      {msg && (
        <p className={`text-[10px] ${status === 'ok' ? 'text-green-600' : 'text-destructive'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [activeCategory, setActiveCategory] = React.useState<Category>('general')
  
  const initialValues = React.useMemo(() => {
    const map: Record<string, string> = {}
    for (const s of initialSettings) {
      map[s.key] = s.value ?? ''
    }
    return map
  }, [initialSettings])

  const [values, setValues] = React.useState<Record<string, string>>(initialValues)
  const [saving, setSaving] = React.useState(false)
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  const [testEmail, setTestEmail] = React.useState('')
  const [testingSMTP, setTestingSMTP] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null)

  async function handleTestSMTP() {
    if (!testEmail) {
      setTestResult({ success: false, message: 'Please enter a test email address' })
      return
    }
    setTestingSMTP(true)
    setTestResult(null)
    try {
      const result = await testSMTPAction(testEmail)
      if ('success' in result) {
        setTestResult({ success: true, message: `Test email sent successfully! Message ID: ${result.messageId || 'N/A'}` })
      } else {
        setTestResult({ success: false, message: `Failed: ${result.error}` })
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `Failed: ${err?.message || 'Error occurred'}` })
    } finally {
      setTestingSMTP(false)
    }
  }

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setSaveSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    const result = await saveSettings(values)
    setSaving(false)
    if ('success' in result) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 shrink-0">
        <nav className="flex lg:flex-col gap-1 p-1 bg-muted/30 rounded-xl border border-border overflow-x-auto lg:overflow-visible">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap lg:whitespace-normal",
                activeCategory === cat.id 
                  ? "bg-background text-primary shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              <cat.icon className="size-4" />
              {cat.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-8 bg-card rounded-2xl border border-border p-8 shadow-sm">
        {activeCategory === 'general' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">General Settings</h2>
                <p className="text-sm text-muted-foreground">Basic site information and contact details.</p>
             </div>
             
             <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                   <Label>Site Name</Label>
                   <Input value={values.site_name} onChange={e => handleChange('site_name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                   <Label>Tagline</Label>
                   <Input value={values.tagline} onChange={e => handleChange('tagline', e.target.value)} />
                </div>

                <div className="sm:col-span-2 pt-4 border-t border-border">
                   <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Church Information</h3>
                   <div className="grid gap-4">
                      <div className="space-y-1.5">
                         <Label>Mission</Label>
                         <Input value={values.mission} onChange={e => handleChange('mission', e.target.value)} placeholder="e.g. To set the captives free" />
                      </div>
                      <div className="space-y-1.5">
                         <Label>Vision</Label>
                         <Input value={values.vision} onChange={e => handleChange('vision', e.target.value)} placeholder="e.g. To cultivate a community that is wealthy healthy and wise" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                         <div className="space-y-1.5">
                            <Label>Founder/Lead Name</Label>
                            <Input value={values.founder_name} onChange={e => handleChange('founder_name', e.target.value)} />
                         </div>
                         <div className="space-y-1.5">
                            <Label>Founder Bio/Title</Label>
                            <Input value={values.founder_bio} onChange={e => handleChange('founder_bio', e.target.value)} />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="sm:col-span-2 pt-4 border-t border-border space-y-4">
                   <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Contact & Operations</h3>
                   <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                         <Label>Contact Email</Label>
                         <Input type="email" value={values.contact_email} onChange={e => handleChange('contact_email', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                         <Label>Contact Phone</Label>
                         <Input type="tel" value={values.contact_phone} onChange={e => handleChange('contact_phone', e.target.value)} />
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                         <Label>Physical Address</Label>
                         <Textarea value={values.address} onChange={e => handleChange('address', e.target.value)} rows={2} />
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                         <Label>Service Times</Label>
                         <Textarea value={values.service_times} onChange={e => handleChange('service_times', e.target.value)} rows={3} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeCategory === 'branding' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">Branding</h2>
                <p className="text-sm text-muted-foreground">Logos, icons, and visual identity.</p>
             </div>

             <div className="space-y-8">
                <BrandingImageField 
                  label="Site Logo"
                  description="The main logo displayed in the header."
                  value={values.site_logo}
                  onUpload={(url) => handleChange('site_logo', url)}
                  onClear={() => handleChange('site_logo', '')}
                />

                <BrandingImageField 
                  label="Site Icon (Favicon)"
                  description="Displayed in browser tabs. Best at 512x512px."
                  value={values.site_icon}
                  onUpload={(url) => handleChange('site_icon', url)}
                  onClear={() => handleChange('site_icon', '')}
                  aspectRatio="square"
                />
             </div>
          </div>
        )}

        {activeCategory === 'seo' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">Global SEO</h2>
                <p className="text-sm text-muted-foreground">Default search engine optimization settings.</p>
             </div>

             <div className="space-y-8">
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <Label>Default Meta Title</Label>
                      <Input value={values.site_meta_title} onChange={e => handleChange('site_meta_title', e.target.value)} />
                      <p className="text-[10px] text-muted-foreground">Used as the base title for all pages.</p>
                   </div>
                   <div className="space-y-1.5">
                      <Label>Default Meta Description</Label>
                      <Textarea value={values.site_meta_description} onChange={e => handleChange('site_meta_description', e.target.value)} rows={3} />
                   </div>
                   <div className="space-y-1.5">
                      <Label>Site Keywords</Label>
                      <Input value={values.site_keywords} onChange={e => handleChange('site_keywords', e.target.value)} placeholder="church, uganda, kingdom deliverance, kampala" />
                   </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <BrandingImageField 
                    label="Default Share Image (OpenGraph)"
                    description="The default image shown when links are shared on Facebook, WhatsApp, Twitter, etc. Best at 1200x630px."
                    value={values.site_og_image}
                    onUpload={(url) => handleChange('site_og_image', url)}
                    onClear={() => handleChange('site_og_image', '')}
                  />
                </div>
             </div>
          </div>
        )}

        {activeCategory === 'email' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="border-b border-border pb-4 flex items-center justify-between">
                <div>
                   <h2 className="text-lg font-bold">SMTP Settings</h2>
                   <p className="text-sm text-muted-foreground">Configure how the system sends emails.</p>
                </div>
                <ShieldCheckIcon className="size-8 text-primary/20" />
             </div>

             <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1.5">
                   <Label>SMTP Host</Label>
                   <Input placeholder="smtp.gmail.com" value={values.smtp_host} onChange={e => handleChange('smtp_host', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                   <Label>SMTP Port</Label>
                   <Input placeholder="587" value={values.smtp_port} onChange={e => handleChange('smtp_port', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                   <Label>Encryption</Label>
                   <Select value={values.smtp_encryption || 'tls'} onValueChange={v => handleChange('smtp_encryption', v ?? 'tls')}>
                      <SelectTrigger>
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="tls">TLS (Recommended)</SelectItem>
                         <SelectItem value="ssl">SSL</SelectItem>
                         <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-1.5">
                   <Label>Username</Label>
                   <Input value={values.smtp_user} onChange={e => handleChange('smtp_user', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                   <Label>Password</Label>
                   <PasswordInput value={values.smtp_pass} onChange={e => handleChange('smtp_pass', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                   <Label>From Email</Label>
                   <Input value={values.smtp_from_email} onChange={e => handleChange('smtp_from_email', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                   <Label>From Name</Label>
                   <Input value={values.smtp_from_name} onChange={e => handleChange('smtp_from_name', e.target.value)} />
                </div>
             </div>

             <div className="pt-6 border-t border-border space-y-4">
                <div>
                   <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Test SMTP Connection</h3>
                   <p className="text-xs text-muted-foreground mt-1">Send a test email to verify that your custom SMTP server settings are working properly. (Make sure to click "Save Settings" at the bottom first if you made changes!)</p>
                </div>
                <div className="flex gap-2 max-w-md">
                   <Input 
                      type="email" 
                      placeholder="test-email@example.com" 
                      value={testEmail} 
                      onChange={e => setTestEmail(e.target.value)} 
                      className="h-10 text-sm"
                   />
                   <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleTestSMTP} 
                      disabled={testingSMTP}
                      className="h-10 text-sm shrink-0"
                   >
                      {testingSMTP ? 'Sending...' : 'Send Test Email'}
                   </Button>
                </div>
                {testResult && (
                   <p className={cn("text-xs font-semibold mt-2", testResult.success ? "text-green-600" : "text-destructive")}>
                      {testResult.message}
                   </p>
                )}
             </div>
          </div>
        )}

        {activeCategory === 'payments' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">Payments & Donations</h2>
                <p className="text-sm text-muted-foreground">Enable and configure online donation gateways.</p>
             </div>

             {/* Stripe */}
             <div className="space-y-4 p-5 rounded-xl border border-border bg-muted/10">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs italic">S</div>
                      <h3 className="font-bold">Stripe Payments</h3>
                   </div>
                   <Switch 
                     checked={values.stripe_enabled === 'true'} 
                     onCheckedChange={checked => handleChange('stripe_enabled', String(checked))} 
                   />
                </div>
                {values.stripe_enabled === 'true' && (
                   <div className="grid gap-4 pt-2">
                      <div className="space-y-1.5">
                         <Label className="text-xs">Publishable Key</Label>
                         <Input value={values.stripe_publishable_key} onChange={e => handleChange('stripe_publishable_key', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-xs">Secret Key</Label>
                         <PasswordInput value={values.stripe_secret_key} onChange={e => handleChange('stripe_secret_key', e.target.value)} />
                      </div>
                   </div>
                )}
             </div>

             {/* PayPal */}
             <div className="space-y-4 p-5 rounded-xl border border-border bg-muted/10">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs italic">P</div>
                      <h3 className="font-bold">PayPal</h3>
                   </div>
                   <Switch 
                     checked={values.paypal_enabled === 'true'} 
                     onCheckedChange={checked => handleChange('paypal_enabled', String(checked))} 
                   />
                </div>
                {values.paypal_enabled === 'true' && (
                   <div className="grid gap-4 pt-2">
                      <div className="space-y-1.5">
                         <Label className="text-xs">Client ID</Label>
                         <Input value={values.paypal_client_id} onChange={e => handleChange('paypal_client_id', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-xs">Secret</Label>
                         <PasswordInput value={values.paypal_secret} onChange={e => handleChange('paypal_secret', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-xs">Environment</Label>
                         <Select value={values.paypal_mode || 'sandbox'} onValueChange={v => handleChange('paypal_mode', v ?? 'sandbox')}>
                            <SelectTrigger>
                               <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                               <SelectItem value="live">Live (Production)</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                   </div>
                )}
             </div>

             {/* Pesapal */}
             <div className="space-y-4 p-5 rounded-xl border border-border bg-muted/10">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-xs italic">Pesapal</div>
                      <h3 className="font-bold">Pesapal (East Africa)</h3>
                   </div>
                   <Switch 
                     checked={values.pesapal_enabled === 'true'} 
                     onCheckedChange={checked => handleChange('pesapal_enabled', String(checked))} 
                   />
                </div>
                {values.pesapal_enabled === 'true' && (
                   <div className="grid gap-4 pt-2">
                      <div className="space-y-1.5">
                         <Label className="text-xs">Consumer Key</Label>
                         <Input value={values.pesapal_consumer_key} onChange={e => handleChange('pesapal_consumer_key', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-xs">Consumer Secret</Label>
                         <PasswordInput value={values.pesapal_consumer_secret} onChange={e => handleChange('pesapal_consumer_secret', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-xs">IPN Notification ID</Label>
                         <div className="flex gap-2">
                           <Input
                             value={values.pesapal_ipn_id || ''}
                             onChange={e => handleChange('pesapal_ipn_id', e.target.value)}
                             placeholder="e.g. a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                             className="font-mono text-xs"
                           />
                           <RegisterIPNButton
                             onSuccess={(id) => handleChange('pesapal_ipn_id', id)}
                           />
                         </div>
                         <p className="text-[10px] text-muted-foreground">
                           This is the <strong>ID</strong> returned after registering your IPN URL — not the URL itself.
                           Click <strong>Auto-Register</strong> to register automatically using your credentials above.
                         </p>
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-xs">Environment</Label>
                         <Select value={values.pesapal_mode || 'sandbox'} onValueChange={v => handleChange('pesapal_mode', v ?? 'sandbox')}>
                            <SelectTrigger>
                               <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                               <SelectItem value="live">Live (Production)</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                   </div>
                )}
             </div>
          </div>
        )}

        {activeCategory === 'integrations' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">API Integrations</h2>
                <p className="text-sm text-muted-foreground">Configure keys for Google APIs and other integrations.</p>
             </div>

             {/* Google PageSpeed Insights */}
             <div className="space-y-4 p-5 rounded-xl border border-border bg-muted/10">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs"><ZapIcon className="size-4" /></div>
                      <div>
                        <h3 className="font-bold">PageSpeed Insights API</h3>
                        <p className="text-xs text-muted-foreground">Monitor site performance and SEO health</p>
                      </div>
                   </div>
                </div>
                <div className="grid gap-4 pt-2">
                   <div className="space-y-1.5">
                      <Label className="text-xs">API Key</Label>
                      <PasswordInput
                        value={values.google_pagespeed_api_key || ''}
                        onChange={e => handleChange('google_pagespeed_api_key', e.target.value)}
                        placeholder="Get your key from Google Cloud Console"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        <a href="https://console.developers.google.com/apis/library/pagespeedonline.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Get PageSpeed API Key →
                        </a>
                      </p>
                   </div>
                </div>
             </div>

             <div className="space-y-4 p-5 rounded-xl border border-border bg-muted/10">
                <div className="flex items-center gap-3">
                   <div className="size-8 rounded-lg bg-red-600 flex items-center justify-center text-white"><Video className="size-4" /></div>
                   <div>
                      <h3 className="font-bold">YouTube Live</h3>
                      <p className="text-xs text-muted-foreground">Powers the Watch Live page with your YouTube channel stream</p>
                   </div>
                </div>
                <div className="grid gap-4 pt-2 sm:grid-cols-2">
                   <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">YouTube Channel URL</Label>
                      <Input
                        value={values.youtube_url || ''}
                        onChange={(e) => handleChange('youtube_url', e.target.value)}
                        placeholder="https://www.youtube.com/@bishopclimateministries"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-xs">YouTube Channel ID</Label>
                      <Input
                        value={values.youtube_channel_id || ''}
                        onChange={(e) => handleChange('youtube_channel_id', e.target.value)}
                        placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-xs">Custom Embed URL (optional)</Label>
                      <Input
                        value={values.live_stream_url || ''}
                        onChange={(e) => handleChange('live_stream_url', e.target.value)}
                        placeholder="https://www.youtube.com/embed/live_stream?channel=..."
                      />
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeCategory === 'social' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">Social Media & Communication</h2>
                <p className="text-sm text-muted-foreground">Manage your online presence and contact numbers.</p>
             </div>
 
             <div className="space-y-8">
                {/* Phone Numbers */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <Label className="text-base font-bold">Additional Phone Numbers</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const current = parseStringArray(values.contact_phones_json)
                          handleChange('contact_phones_json', JSON.stringify([...current, '']))
                        }}
                      >
                         <PlusIcon className="size-3 mr-1" /> Add Phone
                      </Button>
                   </div>
                   <div className="grid gap-3">
                      {parseStringArray(values.contact_phones_json).map((phone: string, idx: number) => (
                         <div key={idx} className="flex gap-2">
                            <Input 
                              value={phone} 
                              onChange={e => {
                                 const current = parseStringArray(values.contact_phones_json)
                                 current[idx] = e.target.value
                                 handleChange('contact_phones_json', JSON.stringify(current))
                              }}
                              placeholder="+256 ..."
                            />
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                 const current = parseStringArray(values.contact_phones_json)
                                 current.splice(idx, 1)
                                 handleChange('contact_phones_json', JSON.stringify(current))
                              }}
                              className="text-destructive shrink-0"
                            >
                               <Trash2Icon className="size-4" />
                            </Button>
                         </div>
                      ))}
                      {parseStringArray(values.contact_phones_json).length === 0 && (
                         <p className="text-xs text-muted-foreground italic">No additional phone numbers added.</p>
                      )}
                   </div>
                </div>
 
                {/* Social Links */}
                <div className="space-y-4 pt-6 border-t border-border">
                   <div className="flex items-center justify-between">
                      <Label className="text-base font-bold">Social Media Platforms</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const current = parseSocialLinks(values.social_links_json)
                          handleChange('social_links_json', JSON.stringify([...current, { platform: 'Facebook', url: '' }]))
                        }}
                      >
                         <PlusIcon className="size-3 mr-1" /> Add Platform
                      </Button>
                   </div>
                   <div className="grid gap-4">
                      {parseSocialLinks(values.social_links_json).map((link, idx: number) => (
                         <div key={idx} className="grid sm:grid-cols-12 gap-2 items-start p-4 rounded-xl border border-border bg-muted/20">
                            <div className="sm:col-span-4">
                               <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Platform</Label>
                               <Input 
                                 value={link.platform} 
                                 onChange={e => {
                                    const current = parseSocialLinks(values.social_links_json)
                                    current[idx].platform = e.target.value
                                    handleChange('social_links_json', JSON.stringify(current))
                                 }}
                                 placeholder="e.g. TikTok, Telegram"
                               />
                            </div>
                            <div className="sm:col-span-7">
                               <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">URL</Label>
                               <Input 
                                 value={link.url} 
                                 onChange={e => {
                                    const current = parseSocialLinks(values.social_links_json)
                                    current[idx].url = e.target.value
                                    handleChange('social_links_json', JSON.stringify(current))
                                 }}
                                 placeholder="https://..."
                               />
                            </div>
                            <div className="sm:col-span-1 pt-6 flex justify-end">
                               <Button 
                                 type="button" 
                                 variant="ghost" 
                                 size="icon" 
                                 onClick={() => {
                                    const current = parseSocialLinks(values.social_links_json)
                                    current.splice(idx, 1)
                                    handleChange('social_links_json', JSON.stringify(current))
                                 }}
                                 className="text-destructive"
                               >
                                  <Trash2Icon className="size-4" />
                               </Button>
                            </div>
                         </div>
                      ))}
                      {parseSocialLinks(values.social_links_json).length === 0 && (
                         <p className="text-xs text-muted-foreground italic">No social media platforms added yet.</p>
                      )}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeCategory === 'qrcodes' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">QR Codes</h2>
                <p className="text-sm text-muted-foreground">
                  Manage QR codes displayed on the public-facing Give / Donate page. Each entry can encode a mobile money number, bank account, PayPal link, or any URL.
                </p>
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <Label className="text-base font-bold">QR Code Entries</Label>
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       const current = parseQrCodes(values.qr_codes_json)
                       handleChange('qr_codes_json', JSON.stringify([
                         ...current,
                         { id: crypto.randomUUID(), title: '', subtitle: '', value: '', color: '#1a1a2e' }
                       ]))
                     }}
                   >
                      <PlusIcon className="size-3 mr-1" /> Add QR Code
                   </Button>
                </div>

                <div className="grid gap-4">
                  {parseQrCodes(values.qr_codes_json).map((entry, idx: number) => (
                    <div key={entry.id || idx} className="p-5 rounded-xl border border-border bg-muted/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Entry #{idx + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const current = parseQrCodes(values.qr_codes_json)
                            current.splice(idx, 1)
                            handleChange('qr_codes_json', JSON.stringify(current))
                          }}
                          className="text-destructive h-7 px-2"
                        >
                          <Trash2Icon className="size-3.5 mr-1" /> Remove
                        </Button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={entry.title}
                            onChange={e => {
                              const current = parseQrCodes(values.qr_codes_json)
                              current[idx].title = e.target.value
                              handleChange('qr_codes_json', JSON.stringify(current))
                            }}
                            placeholder="e.g. Mobile Money – MTN"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Subtitle / Instructions</Label>
                          <Input
                            value={entry.subtitle}
                            onChange={e => {
                              const current = parseQrCodes(values.qr_codes_json)
                              current[idx].subtitle = e.target.value
                              handleChange('qr_codes_json', JSON.stringify(current))
                            }}
                            placeholder="e.g. Scan to pay via MTN MoMo"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label className="text-xs">QR Value (URL, phone number, USSD, etc.)</Label>
                          <Input
                            value={entry.value}
                            onChange={e => {
                              const current = parseQrCodes(values.qr_codes_json)
                              current[idx].value = e.target.value
                              handleChange('qr_codes_json', JSON.stringify(current))
                            }}
                            placeholder="e.g. https://paypal.me/... or +256700000000"
                            className="font-mono text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground">This exact text will be encoded into the QR code. Use a full URL for best compatibility.</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Card Accent Colour</Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={entry.color || '#1a1a2e'}
                              onChange={e => {
                                const current = parseQrCodes(values.qr_codes_json)
                                current[idx].color = e.target.value
                                handleChange('qr_codes_json', JSON.stringify(current))
                              }}
                              className="h-9 w-14 rounded border border-border cursor-pointer bg-transparent"
                            />
                            <span className="text-xs text-muted-foreground font-mono">{entry.color || '#1a1a2e'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {parseQrCodes(values.qr_codes_json).length === 0 && (
                    <div className="text-center py-10 rounded-xl border border-dashed border-border text-muted-foreground">
                      <QrCodeIcon className="size-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No QR codes yet. Click <strong>Add QR Code</strong> to create your first one.</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}

        {/* Form Footer */}
        <div className="flex items-center justify-between border-t border-border pt-6">
           <p className="text-xs text-muted-foreground flex items-center gap-2">
             <AlertTriangleIcon className="size-3" />
             Always ensure API keys are kept secret and never shared.
           </p>
           <Button type="submit" disabled={saving} className="gap-2 min-w-[140px]">
             {saving ? 'Saving...' : <><SaveIcon className="size-4" /> Save Settings</>}
             {saveSuccess && <CheckCircleIcon className="size-4 animate-in zoom-in" />}
           </Button>
        </div>
      </form>
    </div>
  )
}
