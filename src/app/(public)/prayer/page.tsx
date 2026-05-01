'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  HeartIcon, 
  CheckCircle2Icon, 
  Loader2Icon, 
  MessageSquareIcon,
  ShieldCheckIcon,
  PrayingHandIcon
} from 'lucide-react'
import { FadeInSection } from '@/components/ui/page-transition'

export default function PrayerPage() {
  const [form, setForm] = React.useState({ 
    name: '', 
    email: '', 
    phone: '', 
    request: '', 
    is_private: false 
  })
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: dbError } = await supabase
        .from('prayer_requests')
        .insert({
          name: form.name,
          email: form.email,
          phone: form.phone,
          request: form.request,
          is_reviewed: false
        })

      if (dbError) throw dbError
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-32 text-white overflow-hidden bg-[#0d1b3e]">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1445053023192-8d45cb66099d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary" />
        
        <div className="container relative z-10 text-center px-4 max-w-4xl mx-auto">
          <FadeInSection>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
               We Are Praying For You
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              Prayer Request
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto italic">
              "For where two or three are gathered together in my name, there am I in the midst of them." — Matthew 18:20
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-white">
        <div className="container px-4 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Info Panel */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                 <h2 className="font-serif text-3xl font-bold text-primary mb-4">Set the Captives Free</h2>
                 <p className="text-primary/70 leading-relaxed">
                   At Kingdom Deliverance Centre, we believe in the power of intercession. Bishop Climate Wiseman Irungu and our prayer team are committed to standing with you in faith for your breakthrough, healing, and deliverance.
                 </p>
              </div>

              <div className="space-y-6">
                 <div className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="size-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                       <ShieldCheckIcon className="size-5 text-accent" />
                    </div>
                    <div>
                       <h4 className="font-bold text-primary text-sm">Strictly Confidential</h4>
                       <p className="text-xs text-primary/60">Your requests are handled with the utmost privacy and respect.</p>
                    </div>
                 </div>

                 <div className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="size-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                       <MessageSquareIcon className="size-5 text-accent" />
                    </div>
                    <div>
                       <h4 className="font-bold text-primary text-sm">Prayer Chain</h4>
                       <p className="text-xs text-primary/60">Our 24/7 prayer warriors will lift your name before the throne of grace.</p>
                    </div>
                 </div>
              </div>

              <div className="p-6 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
                 <h4 className="font-bold mb-2">Our Vision</h4>
                 <p className="text-sm text-white/80 italic">"To cultivate a community that is wealthy, healthy and wise."</p>
              </div>
            </div>

            {/* Form Panel */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-border p-8 md:p-10 shadow-2xl shadow-primary/5 relative overflow-hidden">
               {success ? (
                 <div className="text-center py-12 animate-in zoom-in duration-500">
                    <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                       <CheckCircle2Icon className="size-10" />
                    </div>
                    <h3 className="font-serif text-3xl font-bold text-primary mb-4">Request Received</h3>
                    <p className="text-primary/70 max-w-xs mx-auto mb-8">
                       Thank you for sharing your heart with us. Our team will begin praying for you immediately.
                    </p>
                    <Button 
                      onClick={() => { setSuccess(false); setForm({ name: '', email: '', phone: '', request: '', is_private: false }) }}
                      className="bg-accent text-primary hover:bg-accent/90"
                    >
                       Submit Another Request
                    </Button>
                 </div>
               ) : (
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                       <h3 className="font-bold text-xl text-primary">How can we pray for you?</h3>
                       <p className="text-sm text-muted-foreground">Fill out the form below and our prayer team will stand in agreement with you.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label htmlFor="p-name">Full Name</Label>
                          <Input 
                            id="p-name" 
                            placeholder="Your Name" 
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})}
                            required
                          />
                       </div>
                       <div className="space-y-2">
                          <Label htmlFor="p-email">Email Address</Label>
                          <Input 
                            id="p-email" 
                            type="email" 
                            placeholder="email@example.com" 
                            value={form.email} 
                            onChange={e => setForm({...form, email: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <Label htmlFor="p-phone">Phone Number (optional)</Label>
                       <Input 
                         id="p-phone" 
                         placeholder="+256..." 
                         value={form.phone} 
                         onChange={e => setForm({...form, phone: e.target.value})}
                       />
                    </div>

                    <div className="space-y-2">
                       <Label htmlFor="p-request">Your Prayer Request</Label>
                       <Textarea 
                         id="p-request" 
                         placeholder="Please share your request here..." 
                         rows={6}
                         className="resize-none"
                         value={form.request} 
                         onChange={e => setForm({...form, request: e.target.value})}
                         required
                       />
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                         {error}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full h-14 text-lg font-bold bg-accent text-primary hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                    >
                       {loading ? <Loader2Icon className="size-5 animate-spin" /> : 'Submit Prayer Request'}
                    </Button>
                    
                    <p className="text-center text-[10px] text-muted-foreground italic">
                       All information submitted is kept strictly confidential within our ministry team.
                    </p>
                 </form>
               )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
