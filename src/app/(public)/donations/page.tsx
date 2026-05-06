"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createDonationOrder } from "@/lib/actions/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Smartphone, Building, CheckCircle, Loader2, CreditCard } from "lucide-react";

const PRESET_AMOUNTS = [
  { label: "UGX 10,000", value: 10000, currency: "UGX" },
  { label: "UGX 50,000", value: 50000, currency: "UGX" },
  { label: "UGX 100,000", value: 100000, currency: "UGX" },
  { label: "UGX 500,000", value: 500000, currency: "UGX" },
];

const methods = [
  {
    id: "online",
    label: "Online Payment",
    icon: <CreditCard className="w-5 h-5" />,
    details: "Secure giving via Pesapal — supports MTN Mobile Money, Airtel Money, Visa, Mastercard and more.",
  }
];

export default function DonationsPage() {
  const [form, setForm] = useState({
    donor_name: "",
    donor_email: "",
    amount: "",
    currency: "UGX",
    notes: "",
    is_anonymous: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreset = (value: number, currency: string) => {
    setForm((f) => ({ ...f, amount: String(value), currency }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setLoading(true);
    setError(null);

    // Pesapal online payment
    const result = await createDonationOrder({
      donor_name: form.is_anonymous ? null : form.donor_name || null,
      donor_email: form.is_anonymous ? null : form.donor_email || null,
      amount,
      currency: form.currency,
      notes: form.notes || undefined,
      is_anonymous: form.is_anonymous,
    });

    if (result.success && result.paymentUrl) {
      window.location.href = result.paymentUrl;
      return;
    }

    setError(result.error || "Failed to initiate payment. Please try again.");
    setLoading(false);
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative pt-48 pb-32 lg:pt-56 lg:pb-40 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="container relative z-10 text-center px-4">
          <div className="w-16 h-16 bg-accent/20 border-2 border-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-accent" fill="currentColor" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-6">
            Partner With Us
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight">
            Building the Church
          </h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mt-6 text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            Join Bishop Climate Wiseman Irungu and Pastor Clear in our mission to set the captives free and build a
            house for God&apos;s glory in Uganda.
          </p>
        </div>
      </section>

      <div className="py-6 bg-accent/10 border-y border-accent/20">
        <p className="text-center font-serif text-primary text-lg italic">
          &quot;Each of you should give what you have decided in your heart to give... for God loves a cheerful
          giver.&quot;
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
                <div className="w-full text-left rounded-2xl border-2 p-5 border-accent bg-accent/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-accent text-primary">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-primary">Online Payment</span>
                  </div>
                  <p className="text-sm text-primary/70 whitespace-pre-line leading-relaxed pl-12">
                    Secure giving via Pesapal — supports MTN Mobile Money, Airtel Money, Visa, Mastercard and more. All donations are securely processed and go directly to supporting the ministry.
                  </p>
                </div>
              </div>

              {/* Secure badge */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-800">
                  Online payments are processed securely via <strong>Pesapal</strong> — PCI/DSS compliant.
                </p>
              </div>
            </div>

            {/* Form */}
            <div>
              <h2 className="font-serif text-3xl font-bold text-primary mb-6">
                Give Online
              </h2>

              {success ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                  <h3 className="font-serif text-2xl font-bold text-primary">Thank You!</h3>
                  <p className="text-primary/70 leading-relaxed">
                    Your giving has been recorded. May God bless you abundantly for your generous heart.
                  </p>
                  <Button
                    onClick={() => setSuccess(false)}
                    variant="outline"
                    className="border-primary text-primary mt-4"
                  >
                    Give Again
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Anonymous toggle */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={form.is_anonymous}
                      onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <Label htmlFor="anonymous" className="text-primary/70 cursor-pointer">
                      Give anonymously
                    </Label>
                  </div>

                  {/* Name + Email */}
                  {!form.is_anonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="donor-name">Full Name</Label>
                        <Input
                          id="donor-name"
                          placeholder="Your Name"
                          value={form.donor_name}
                          onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="donor-email">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="donor-email"
                          type="email"
                          placeholder="email@example.com"
                          value={form.donor_email}
                          onChange={(e) => setForm({ ...form, donor_email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Preset amounts */}
                  <div className="space-y-2">
                    <Label>Quick Amount</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_AMOUNTS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => handlePreset(p.value, p.currency)}
                          className={`text-xs font-semibold py-2 rounded-lg border transition-all ${
                            form.amount === String(p.value) && form.currency === p.currency
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-primary/15 text-primary/70 hover:border-accent/50"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount + Currency */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        placeholder="50000"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <select
                        id="currency"
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        className="w-full border border-input rounded-md h-10 px-3 text-sm bg-background"
                      >
                        <option value="UGX">UGX — Uganda Shillings</option>
                        <option value="USD">USD — US Dollars</option>
                        <option value="KES">KES — Kenyan Shillings</option>
                        <option value="TZS">TZS — Tanzanian Shillings</option>
                        <option value="RWF">RWF — Rwandan Francs</option>
                        <option value="NGN">NGN — Nigerian Naira</option>
                        <option value="GHS">GHS — Ghanaian Cedi</option>
                        <option value="ZAR">ZAR — South African Rand</option>
                        <option value="GBP">GBP — British Pounds</option>
                        <option value="EUR">EUR — Euros</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="e.g. Tithe, Building Fund, Missions..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-accent text-primary hover:bg-accent/90 font-semibold text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Redirecting to payment...
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" fill="currentColor" />
                        Give Now via Pesapal
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    🔒 You will be redirected to Pesapal&apos;s secure payment page.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
