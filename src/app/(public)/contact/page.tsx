"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, CheckCircle, Loader2, Send, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: dbError } = await supabase.from("contact_submissions").insert(form);
    if (dbError) {
      setError("Failed to send message. Please try again.");
    } else {
      setSuccess(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative pt-40 pb-24 text-white overflow-hidden bg-[#0a121f]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#eab308] mb-8">
            <MessageSquare className="w-3.5 h-3.5" /> Get In Touch
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Connect With <span className="text-[#eab308]">Us</span>
          </h1>
          <div className="mx-auto mt-8 h-1 w-20 rounded-full bg-gradient-to-r from-[#eab308] to-yellow-500" />
          <p className="mt-8 text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Have questions or need prayer? Our team is here to support you. Reach out and let us walk this spiritual journey together.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 -mt-10 relative z-20">
        <div className="container px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Contact Info & Map */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="font-serif text-3xl font-bold text-[#0a121f] mb-8">Contact Information</h2>
                <div className="space-y-8">
                  {[
                    { icon: <MapPin className="w-5 h-5" />, label: "Visit Us", value: "Kingdom Deliverance Centre Uganda\nKampala, Uganda" },
                    { icon: <Phone className="w-5 h-5" />, label: "Call Us", value: "+256 700 000 000" },
                    { icon: <Mail className="w-5 h-5" />, label: "Email Us", value: "info@kdcuganda.org" },
                    { icon: <Clock className="w-5 h-5" />, label: "Service Hours", value: "Sunday: 9:00 AM & 11:30 AM\nWednesday: 6:30 PM\nFriday: 6:30 PM" },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-5 group">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-[#eab308] group-hover:bg-[#eab308] group-hover:text-white transition-all duration-300">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-[#0a121f] font-bold whitespace-pre-line leading-relaxed">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Container */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
                <div className="h-80 relative">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7573!2d32.5825!3d0.3136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177dbc0f9d74b39b%3A0x4099d33b10770b2!2sKingdom+Deliverance+Centre+Uganda!5e0!3m2!1sen!2sug!4v1714000000000"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">KDC HQ • Kampala</span>
                  <Link
                    href="https://maps.app.goo.gl/RrBd8tDxEDky8D6N7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#eab308] font-bold text-xs uppercase tracking-widest hover:underline"
                  >
                    Direction <MapPin className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="lg:col-span-7">
              <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1 h-6 bg-[#eab308] rounded-full" />
                  <h2 className="text-3xl font-bold font-serif text-[#0a121f]">Send Message</h2>
                </div>

                {success ? (
                  <div className="flex flex-col items-center justify-center gap-6 py-20 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-serif text-3xl font-bold text-[#0a121f]">Message Received!</h3>
                      <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                        Thank you for reaching out. A member of our team will contact you shortly. May God bless you.
                      </p>
                    </div>
                    <Button 
                      onClick={() => setSuccess(false)} 
                      variant="outline" 
                      className="border-[#0a121f] text-[#0a121f] hover:bg-[#0a121f] hover:text-white mt-4 rounded-full px-10 h-12 font-bold transition-all"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</Label>
                        <Input 
                          id="contact-name" 
                          placeholder="Your Name" 
                          className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#eab308] focus:border-[#eab308]"
                          value={form.name} 
                          onChange={e => setForm({ ...form, name: e.target.value })} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</Label>
                        <Input 
                          id="contact-email" 
                          type="email" 
                          placeholder="example@email.com" 
                          className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#eab308] focus:border-[#eab308]"
                          value={form.email} 
                          onChange={e => setForm({ ...form, email: e.target.value })} 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="contact-phone" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</Label>
                        <Input 
                          id="contact-phone" 
                          placeholder="+256 ..." 
                          className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#eab308] focus:border-[#eab308]"
                          value={form.phone} 
                          onChange={e => setForm({ ...form, phone: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-subject" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Subject</Label>
                        <Input 
                          id="contact-subject" 
                          placeholder="How can we help?" 
                          className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#eab308] focus:border-[#eab308]"
                          value={form.subject} 
                          onChange={e => setForm({ ...form, subject: e.target.value })} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-message" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Your Message</Label>
                      <Textarea 
                        id="contact-message" 
                        placeholder="Type your message here..." 
                        rows={6} 
                        className="bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#eab308] focus:border-[#eab308] resize-none"
                        value={form.message} 
                        onChange={e => setForm({ ...form, message: e.target.value })} 
                        required 
                      />
                    </div>

                    {error && (
                      <div className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-2xl px-6 py-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        {error}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full bg-[#eab308] hover:bg-[#0a121f] text-[#0a121f] hover:text-white h-16 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#eab308]/10 transition-all duration-300 group"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">
                          Send Your Message <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
