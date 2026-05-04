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
  Share2Icon
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
import { createMediaRecord } from '@/lib/actions/media'
import { createClient } from '@/lib/supabase/client'
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
  { id: 'social', label: 'Social & Links', icon: Share2Icon },
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
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `branding/${fileName}`

      // 1. Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      // 3. Create Media Record
      await createMediaRecord({
        filename: file.name,
        url: publicUrl,
        type: 'image',
        mime_type: file.type,
        size_bytes: file.size,
        bucket: 'media'
      })

      onUpload(publicUrl)
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
                         <Input type="password" value={values.pesapal_consumer_secret} onChange={e => handleChange('pesapal_consumer_secret', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-xs">IPN ID</Label>
                         <Input
                           value={values.pesapal_ipn_id || ''}
                           onChange={e => handleChange('pesapal_ipn_id', e.target.value)}
                           placeholder="Register IPN in Pesapal dashboard → copy ID here"
                         />
                         <p className="text-[10px] text-muted-foreground">
                           Get this from your Pesapal merchant dashboard under IPN settings.
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
                          const current = values.contact_phones_json ? JSON.parse(values.contact_phones_json) : []
                          handleChange('contact_phones_json', JSON.stringify([...current, '']))
                        }}
                      >
                         <PlusIcon className="size-3 mr-1" /> Add Phone
                      </Button>
                   </div>
                   <div className="grid gap-3">
                      {(values.contact_phones_json ? JSON.parse(values.contact_phones_json) : []).map((phone: string, idx: number) => (
                         <div key={idx} className="flex gap-2">
                            <Input 
                              value={phone} 
                              onChange={e => {
                                 const current = JSON.parse(values.contact_phones_json)
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
                                 const current = JSON.parse(values.contact_phones_json)
                                 current.splice(idx, 1)
                                 handleChange('contact_phones_json', JSON.stringify(current))
                              }}
                              className="text-destructive shrink-0"
                            >
                               <Trash2Icon className="size-4" />
                            </Button>
                         </div>
                      ))}
                      {(!values.contact_phones_json || JSON.parse(values.contact_phones_json).length === 0) && (
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
                          const current = values.social_links_json ? JSON.parse(values.social_links_json) : []
                          handleChange('social_links_json', JSON.stringify([...current, { platform: 'Facebook', url: '' }]))
                        }}
                      >
                         <PlusIcon className="size-3 mr-1" /> Add Platform
                      </Button>
                   </div>
                   <div className="grid gap-4">
                      {(values.social_links_json ? JSON.parse(values.social_links_json) : []).map((link: any, idx: number) => (
                         <div key={idx} className="grid sm:grid-cols-12 gap-2 items-start p-4 rounded-xl border border-border bg-muted/20">
                            <div className="sm:col-span-4">
                               <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Platform</Label>
                               <Input 
                                 value={link.platform} 
                                 onChange={e => {
                                    const current = JSON.parse(values.social_links_json)
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
                                    const current = JSON.parse(values.social_links_json)
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
                                    const current = JSON.parse(values.social_links_json)
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
                      {(!values.social_links_json || JSON.parse(values.social_links_json).length === 0) && (
                         <p className="text-xs text-muted-foreground italic">No social media platforms added yet.</p>
                      )}
                   </div>
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
