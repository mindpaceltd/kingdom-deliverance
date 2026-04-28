"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Smartphone, Building, CheckCircle, Loader2, CreditCard } from "lucide-react";

const methods = [
  { id: "mobile_money", label: "Mobile Money", icon: <Smartphone className="w-5 h-5" />, details: "MTN: *165*3*1*XXXXXXXXX# | Airtel: *185*9#\nSend to: 0700 000 000 (Kingdom Deliverance)" },
  { id: "bank_transfer", label: "Bank Transfer", icon: <Building className="w-5 h-5" />, details: "Bank: Stanbic Bank Uganda\nAccount Name: Kingdom Deliverance Centre\nAccount No: 9030009XXXXXXXX\nBranch: Kampala" },
  { id: "online", label: "Online Payment", icon: <CreditCard className="w-5 h-5" />, details: "Coming soon — online giving via card will be available shortly." },
];

export default function DonationsPage() {
  const [form, setForm] = useState({ donor_name: "", donor_email: "", amount: "", currency: "UGX", method: "mobile_money", notes: "", is_anonymous: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState("mobile_money");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { setError("Please enter a valid amount."); return; }
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error: dbError } = await supabase.from("donations").insert({
      ...form,
      amount: Number(form.amount),
      method: activeMethod,
      status: "pending",
    });
    if (dbError) setError("Failed to record donation. Please try again.");
    else setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-40 bg-[#0d1b3e] text-white overflow-hidden">
        <div className="container relative z-10 text-center px-4">
          <div className="w-16 h-16 bg-accent/20 border-2 border-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-accent" fill="currentColor" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-6">
            Partner With Us
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight">Give &amp; Support</h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mt-6 text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            Your generosity empowers the Gospel, supports our community programs, and helps us build the Kingdom of God in Uganda and beyond.
          </p>
        </div>
      </section>

      <div className="py-6 bg-accent/10 border-y border-accent/20">
        <p className="text-center font-serif text-primary text-lg italic">
          &quot;Each of you should give what you have decided in your heart to give... for God loves a cheerful giver.&quot;
          <span className="not-italic font-semibold ml-2">— 2 Corinthians 9:7</span>
        </p>
      </div>

      {/* Giving Options + Form */}
      <section className="py-20 bg-white">
        <div className="container px-4 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Methods */}
            <div className="space-y-8">
              <h2 className="font-serif text-3xl font-bold text-primary">How to Give</h2>
              <div className="space-y-4">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMethod(m.id)}
                    className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${activeMethod === m.id ? "border-accent bg-accent/5" : "border-primary/10 hover:border-primary/30"}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${activeMethod === m.id ? "bg-accent text-primary" : "bg-muted text-primary/60"}`}>
                        {m.icon}
                      </div>
                      <span className="font-semibold text-primary">{m.label}</span>
                    </div>
                    {activeMethod === m.id && (
                      <p className="text-sm text-primary/70 whitespace-pre-line leading-relaxed pl-12">{m.details}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <div>
              <h2 className="font-serif text-3xl font-bold text-primary mb-6">Record Your Gift</h2>
              {success ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                  <h3 className="font-serif text-2xl font-bold text-primary">Thank You!</h3>
                  <p className="text-primary/70 leading-relaxed">Your giving has been recorded. May God bless you abundantly for your generous heart.</p>
                  <Button onClick={() => setSuccess(false)} variant="outline" className="border-primary text-primary mt-4">Give Again</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="anonymous" checked={form.is_anonymous} onChange={e => setForm({ ...form, is_anonymous: e.target.checked })} className="w-4 h-4 accent-amber-500" />
                    <Label htmlFor="anonymous" className="text-primary/70 cursor-pointer">Give anonymously</Label>
                  </div>

                  {!form.is_anonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="donor-name">Full Name</Label>
                        <Input id="donor-name" placeholder="Your Name" value={form.donor_name} onChange={e => setForm({ ...form, donor_name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="donor-email">Email</Label>
                        <Input id="donor-email" type="email" placeholder="email@example.com" value={form.donor_email} onChange={e => setForm({ ...form, donor_email: e.target.value })} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <Input id="amount" type="number" min="0" placeholder="50000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <select id="currency" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full border border-input rounded-md h-10 px-3 text-sm bg-background">
                        <option value="UGX">UGX (Uganda Shillings)</option>
                        <option value="USD">USD (US Dollars)</option>
                        <option value="KES">KES (Kenyan Shillings)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea id="notes" placeholder="e.g. Tithe, Building Fund, Missions..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
                  </div>

                  {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>}

                  <Button type="submit" disabled={loading} className="w-full h-12 bg-accent text-primary hover:bg-accent/90 font-semibold text-base">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recording...</> : <><Heart className="w-4 h-4 mr-2" fill="currentColor" /> Record My Gift</>}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">By submitting, you confirm that you have sent the donation via the selected method.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
