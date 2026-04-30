"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Smartphone, Building, CheckCircle, Loader2, CreditCard, Sparkles, ChevronRight } from "lucide-react";

const methods = [
  { id: "mobile_money", label: "Mobile Money", icon: <Smartphone className="w-5 h-5" />, details: "MTN: *165*3*1*XXXXXXXXX# | Airtel: *185*9#\nSend to: 0700 000 000 (Kingdom Deliverance)" },
  { id: "bank_transfer", label: "Bank Transfer", icon: <Building className="w-5 h-5" />, details: "Bank: Stanbic Bank Uganda\nAccount Name: Kingdom Deliverance Centre\nAccount No: 9030009XXXXXXXX\nBranch: Kampala" },
  { id: "online", label: "Online Payment", icon: <CreditCard className="w-5 h-5" />, details: "Our online giving portal via secure card processing is currently being finalized. Please use Mobile Money or Bank Transfer in the meantime." },
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
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative pt-40 pb-24 text-white overflow-hidden bg-[#0a121f]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="w-20 h-20 bg-[#eab308]/10 border border-[#eab308]/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#eab308]/10 rotate-3 group hover:rotate-0 transition-transform duration-500">
            <Heart className="w-10 h-10 text-[#eab308]" fill="currentColor" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#eab308] mb-8">
            <Sparkles className="w-3.5 h-3.5" /> Partner With Us
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Giving & <span className="text-[#eab308]">Kingdom</span> Seeds
          </h1>
          <div className="mx-auto mt-8 h-1 w-20 rounded-full bg-gradient-to-r from-[#eab308] to-yellow-500" />
          <p className="mt-8 text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Your generosity empowers the Gospel and helps us build the Kingdom of God. Together, we can reach more souls and impact lives for eternity.
          </p>
        </div>
      </section>

      {/* Scripture Quote */}
      <div className="py-10 bg-white border-b border-gray-50 overflow-hidden">
        <div className="container px-4">
          <p className="text-center font-serif text-[#0a121f] text-xl md:text-2xl italic max-w-4xl mx-auto relative">
            <span className="absolute -left-8 -top-4 text-6xl text-[#eab308] opacity-20 font-serif">&ldquo;</span>
            Each of you should give what you have decided in your heart to give... for God loves a cheerful giver.
            <span className="absolute -right-8 -bottom-8 text-6xl text-[#eab308] opacity-20 font-serif">&rdquo;</span>
            <span className="block not-italic font-black text-[#eab308] text-xs uppercase tracking-[0.3em] mt-6">— 2 Corinthians 9:7</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-20 relative z-20">
        <div className="container px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Giving Methods */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="font-serif text-3xl font-bold text-[#0a121f] mb-8">How to Give</h2>
                <div className="space-y-4">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveMethod(m.id)}
                      className={`w-full text-left rounded-2xl border transition-all duration-300 p-6 flex flex-col group ${
                        activeMethod === m.id 
                          ? "border-[#eab308] bg-[#eab308]/5 shadow-lg shadow-[#eab308]/5" 
                          : "border-gray-100 hover:border-[#eab308]/30 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                            activeMethod === m.id ? "bg-[#eab308] text-[#0a121f]" : "bg-gray-50 text-gray-400 group-hover:text-[#eab308]"
                          }`}>
                            {m.icon}
                          </div>
                          <span className={`font-bold transition-colors ${activeMethod === m.id ? "text-[#0a121f]" : "text-gray-500"}`}>
                            {m.label}
                          </span>
                        </div>
                        {activeMethod === m.id ? (
                          <CheckCircle className="w-5 h-5 text-[#eab308]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                        )}
                      </div>
                      
                      <div className={`overflow-hidden transition-all duration-500 ${activeMethod === m.id ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
                        <p className="text-sm text-[#0a121f]/70 whitespace-pre-line leading-relaxed pl-16">
                          {m.details}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-10 p-6 bg-[#0a121f] rounded-2xl text-white relative overflow-hidden group">
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-[#eab308] opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
                  <h4 className="font-bold mb-2">Global Partner?</h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    If you are giving from outside Uganda and need alternative international transfer details, please contact our finance team.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Donation Record Form */}
            <div className="lg:col-span-7">
              <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1 h-6 bg-[#eab308] rounded-full" />
                  <h2 className="text-3xl font-bold font-serif text-[#0a121f]">Record Your Gift</h2>
                </div>

                {success ? (
                  <div className="flex flex-col items-center justify-center gap-6 py-20 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-serif text-3xl font-bold text-[#0a121f]">Seed Recorded!</h3>
                      <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                        Thank you for your generous heart. Your gift has been recorded in our system. May God bless you abundantly.
                      </p>
                    </div>
                    <Button 
                      onClick={() => setSuccess(false)} 
                      variant="outline" 
                      className="border-[#0a121f] text-[#0a121f] hover:bg-[#0a121f] hover:text-white mt-4 rounded-full px-10 h-12 font-bold transition-all"
                    >
                      Record Another Gift
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 group cursor-pointer hover:border-[#eab308]/30 transition-colors">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          id="anonymous" 
                          checked={form.is_anonymous} 
                          onChange={e => setForm({ ...form, is_anonymous: e.target.checked })} 
                          className="peer appearance-none w-6 h-6 border-2 border-gray-200 rounded-lg checked:bg-[#eab308] checked:border-[#eab308] transition-all cursor-pointer" 
                        />
                        <CheckCircle className="absolute w-4 h-4 text-[#0a121f] left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <Label htmlFor="anonymous" className="font-bold text-[#0a121f] cursor-pointer flex-1">Give anonymously</Label>
                    </div>

                    {!form.is_anonymous && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <Label htmlFor="donor-name" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Your Name</Label>
                          <Input 
                            id="donor-name" 
                            placeholder="Full Name" 
                            className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#eab308] focus:border-[#eab308]"
                            value={form.donor_name} 
                            onChange={e => setForm({ ...form, donor_name: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="donor-email" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</Label>
                          <Input 
                            id="donor-email" 
                            type="email" 
                            placeholder="example@email.com" 
                            className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#eab308] focus:border-[#eab308]"
                            value={form.donor_email} 
                            onChange={e => setForm({ ...form, donor_email: e.target.value })} 
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Amount</Label>
                        <Input 
                          id="amount" 
                          type="number" 
                          min="0" 
                          placeholder="e.g. 50,000" 
                          className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#eab308] focus:border-[#eab308]"
                          value={form.amount} 
                          onChange={e => setForm({ ...form, amount: e.target.value })} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Currency</Label>
                        <select 
                          id="currency" 
                          value={form.currency} 
                          onChange={e => setForm({ ...form, currency: e.target.value })} 
                          className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-4 text-sm font-bold focus:ring-1 focus:ring-[#eab308] outline-none"
                        >
                          <option value="UGX">UGX (Uganda Shillings)</option>
                          <option value="USD">USD (US Dollars)</option>
                          <option value="KES">KES (Kenyan Shillings)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Purpose of Gift</Label>
                      <Textarea 
                        id="notes" 
                        placeholder="e.g. Tithe, Offering, Building Fund, Missions..." 
                        value={form.notes} 
                        onChange={e => setForm({ ...form, notes: e.target.value })} 
                        rows={3} 
                        className="bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#eab308] focus:border-[#eab308] resize-none"
                      />
                    </div>

                    {error && (
                      <div className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-2xl px-6 py-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        {error}
                      </div>
                    )}

                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full bg-[#eab308] hover:bg-[#0a121f] text-[#0a121f] hover:text-white h-16 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#eab308]/10 transition-all duration-300 group"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-3">
                            <Heart className={`w-5 h-5 transition-transform group-hover:scale-125 ${form.amount ? "fill-current" : ""}`} />
                            Record My Kingdom Seed
                          </span>
                        )}
                      </Button>
                      <p className="text-[10px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest">
                        By submitting, you confirm that you have sent the donation via the selected method.
                      </p>
                    </div>
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
