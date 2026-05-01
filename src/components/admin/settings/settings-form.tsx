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
  AlertTriangleIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { saveSettings } from '@/lib/actions/settings'
import type { SiteSetting } from '@/lib/types'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Settings Categories
// ---------------------------------------------------------------------------

type Category = 'general' | 'branding' | 'seo' | 'email' | 'payments'

const CATEGORIES: { id: Category; label: string; icon: any }[] = [
  { id: 'general', label: 'General', icon: GlobeIcon },
  { id: 'branding', label: 'Branding', icon: PaletteIcon },
  { id: 'seo', label: 'SEO Settings', icon: SearchIcon },
  { id: 'email', label: 'Email (SMTP)', icon: MailIcon },
  { id: 'payments', label: 'Payments', icon: CreditCardIcon },
]

// ---------------------------------------------------------------------------
// SettingsForm
// ---------------------------------------------------------------------------

interface SettingsFormProps {
  initialSettings: SiteSetting[]
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
        )}

        {activeCategory === 'branding' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">Branding</h2>
                <p className="text-sm text-muted-foreground">Logos, icons, and visual identity.</p>
             </div>

             <div className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2 items-start">
                   <div className="space-y-3">
                      <Label className="text-base font-bold">Site Logo</Label>
                      <p className="text-xs text-muted-foreground">The main logo displayed in the header.</p>
                      <Input placeholder="URL to your logo image" value={values.site_logo} onChange={e => handleChange('site_logo', e.target.value)} />
                   </div>
                   <div className="aspect-video relative rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/20 overflow-hidden">
                      {values.site_logo ? <img src={values.site_logo} alt="Logo Preview" className="max-h-full object-contain" /> : <ImageIcon className="size-8 opacity-20" />}
                   </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 items-start">
                   <div className="space-y-3">
                      <Label className="text-base font-bold">Site Icon (Favicon)</Label>
                      <p className="text-xs text-muted-foreground">Displayed in browser tabs. Best at 512x512px.</p>
                      <Input placeholder="URL to your site icon" value={values.site_icon} onChange={e => handleChange('site_icon', e.target.value)} />
                   </div>
                   <div className="size-24 relative rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/20 overflow-hidden">
                      {values.site_icon ? <img src={values.site_icon} alt="Icon Preview" className="size-full object-contain" /> : <ImageIcon className="size-6 opacity-20" />}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeCategory === 'seo' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">Global SEO</h2>
                <p className="text-sm text-muted-foreground">Default search engine optimization settings.</p>
             </div>

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
                   <Select value={values.smtp_encryption || 'tls'} onValueChange={v => handleChange('smtp_encryption', v)}>
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
                   <Input type="password" value={values.smtp_pass} onChange={e => handleChange('smtp_pass', e.target.value)} />
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
                         <Input type="password" value={values.stripe_secret_key} onChange={e => handleChange('stripe_secret_key', e.target.value)} />
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
                         <Input type="password" value={values.paypal_secret} onChange={e => handleChange('paypal_secret', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-xs">Environment</Label>
                         <Select value={values.paypal_mode || 'sandbox'} onValueChange={v => handleChange('paypal_mode', v)}>
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
                         <Input type="password" value={values.pesapal_consumer_secret} onChange={e => handleChange('pesapal_consumer_secret', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-xs">Environment</Label>
                         <Select value={values.pesapal_mode || 'sandbox'} onValueChange={v => handleChange('pesapal_mode', v)}>
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
