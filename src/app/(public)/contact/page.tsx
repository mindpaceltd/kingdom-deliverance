"use client";

import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, CheckCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroUrl, setHeroUrl] = useState('https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=2074&auto=format&fit=crop');
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSettingsAndImages = async () => {
      const supabase = createClient();
      
      const [settingsRes, heroRes] = await Promise.all([
        supabase.from('site_settings').select('key, value'),
        supabase.from('organization_images').select('url').eq('type', 'hero').eq('is_active', true).maybeSingle()
      ]);

      if (settingsRes.data) {
        setSettings(Object.fromEntries(settingsRes.data.map(s => [s.key, s.value])));
      }
      
      if (heroRes.data?.url) {
        setHeroUrl(heroRes.data.url);
      }
    };
    fetchSettingsAndImages();
  }, []);

  const additionalPhones = settings.contact_phones_json ? JSON.parse(settings.contact_phones_json) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Use the server action to submit and trigger the email
    const { submitContactForm } = await import("@/lib/actions/forms");
    const result = await submitContactForm(form);
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative pt-48 pb-32 lg:pt-56 lg:pb-40 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroUrl}')` }} />
        <div className="absolute inset-0 bg-black/70" />
        <div className="container relative z-10 text-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
            Get In Touch
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight">Contact Us</h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mt-6 text-white/90 text-lg md:text-xl max-w-xl mx-auto">
            We would love to hear from you. Reach out with any questions, prayer requests, or to learn more about our church.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
            {/* Info */}
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-3xl font-bold text-primary mb-6">Find Us</h2>
                <div className="space-y-6">
                  {[
                    { icon: <MapPin className="w-5 h-5 text-accent" />, label: "Address", value: settings.address || "Kingdom Deliverance Centre Uganda\nKampala, Uganda" },
                    { 
                      icon: <Phone className="w-5 h-5 text-accent" />, 
                      label: "Phone", 
                      value: [settings.contact_phone || "+256 700 000 000", ...additionalPhones].join("\n") 
                    },
                    { icon: <Mail className="w-5 h-5 text-accent" />, label: "Email", value: settings.contact_email || "info@kdcuganda.org" },
                    { icon: <Clock className="w-5 h-5 text-accent" />, label: "Service Times", value: "Sunday: 10:00 AM (EAT)\nWednesday: 6:00 PM (EAT)\nFriday: 6:00 PM (EAT)" },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">{item.icon}</div>
                      <div>
                        <p className="font-semibold text-primary">{item.label}</p>
                        <p className="text-primary/70 whitespace-pre-line mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div className="rounded-2xl overflow-hidden shadow-lg bg-muted">
                <div className="h-72">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7573!2d32.5825!3d0.3136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177dbc0f9d74b39b%3A0x4099d33b10770b2!2sKingdom+Deliverance+Centre+Uganda!5e0!3m2!1sen!2sug!4v1714000000000"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <a
                  href="https://maps.app.goo.gl/RrBd8tDxEDky8D6N7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 bg-accent/10 hover:bg-accent/20 text-accent font-semibold text-sm transition-colors duration-200"
                >
                  <MapPin className="w-4 h-4" />
                  Open in Google Maps
                </a>
              </div>
            </div>

            {/* Form */}
            <div>
              <h2 className="font-serif text-3xl font-bold text-primary mb-6">Send a Message</h2>
              {success ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                  <h3 className="font-serif text-2xl font-bold text-primary">Message Sent!</h3>
                  <p className="text-primary/70">Thank you for reaching out. We will get back to you as soon as possible.</p>
                  <Button onClick={() => setSuccess(false)} variant="outline" className="border-primary text-primary mt-4">Send Another Message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Full Name *</Label>
                      <Input id="contact-name" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email *</Label>
                      <Input id="contact-email" type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone (optional)</Label>
                    <Input id="contact-phone" placeholder="+256 700 000 000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">Subject *</Label>
                    <Input id="contact-subject" placeholder="How can we help?" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message *</Label>
                    <Textarea id="contact-message" placeholder="Write your message here..." rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                  </div>
                  {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>}
                  <Button type="submit" disabled={loading} className="w-full bg-accent text-primary hover:bg-accent/90 h-12 font-semibold text-base">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
