'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createDonationOrder } from '@/lib/actions/donations';
import { useCurrency, FALLBACK_RATES, SUPPORTED_CURRENCIES } from '@/lib/currency-context';
import { donationDigits, donationFromUsd, donationRate, formatDonation } from '@/lib/donation-currency';
import { ArrowUpRight, CreditCard, Heart, HandHeart, Loader2, LockKeyhole, Smartphone } from 'lucide-react';

const PRESETS_UGX = [10000, 50000, 100000, 500000];
const CURRENCY_NAMES: Record<string, string> = { UGX: 'Uganda shillings', USD: 'US dollars', KES: 'Kenyan shillings', TZS: 'Tanzanian shillings', RWF: 'Rwandan francs', NGN: 'Nigerian naira', GHS: 'Ghanaian cedi', ZAR: 'South African rand', GBP: 'British pounds', EUR: 'Euros' };
const inputClass = 'w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-[#0d1b3e] outline-none transition focus:border-[#947332] focus:ring-4 focus:ring-[#e7ca83]/25 disabled:opacity-60';
const labelClass = 'mb-2 block text-sm font-semibold text-[#0d1b3e]';

export default function DonationsPage() {
  const { rates: contextRates } = useCurrency();
  const rates = { ...FALLBACK_RATES, ...contextRates };
  const [form, setForm] = useState({ donor_name: '', donor_email: '', amount: '', currency: 'UGX', notes: '', is_anonymous: false });
  // Retain the unrounded gift value so switching currencies does not compound rounding.
  const [amountUsd, setAmountUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amount = Number(form.amount);
  const validAmount = Number.isFinite(amount) && amount > 0;
  const ugxAmount = validAmount ? donationFromUsd(amount / donationRate(form.currency, rates), 'UGX', rates) : 0;
  const digits = donationDigits(form.currency);
  const presets = PRESETS_UGX.map(value => donationFromUsd(value / donationRate('UGX', rates), form.currency, rates));

  function changeCurrency(currency: string) {
    setForm(f => ({ ...f, currency, amount: amountUsd === null ? '' : String(donationFromUsd(amountUsd, currency, rates)) }));
    setError(null);
  }
  function changeAmount(value: string) {
    const parsed = Number(value);
    setAmountUsd(value !== '' && Number.isFinite(parsed) && parsed > 0 ? parsed / donationRate(form.currency, rates) : null);
    setForm(f => ({ ...f, amount: value }));
    setError(null);
  }
  function choosePreset(index: number) {
    setAmountUsd(PRESETS_UGX[index] / donationRate('UGX', rates));
    setForm(f => ({ ...f, amount: String(presets[index]) }));
    setError(null);
  }
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (!validAmount || ugxAmount < 1) { setError('Please enter a valid gift amount.'); return; }
    setLoading(true); setError(null);
    try {
      const result = await createDonationOrder({ donor_name: form.is_anonymous ? null : form.donor_name || null, donor_email: form.is_anonymous ? null : form.donor_email || null, amount, currency: form.currency, notes: form.notes || undefined, is_anonymous: form.is_anonymous });
      if (result.success && result.paymentUrl) { window.location.href = result.paymentUrl; return; }
      setError(result.error || 'Unable to start your payment. Please try again.');
    } catch { setError('Unable to connect. Please try again.'); }
    setLoading(false);
  }

  return <div className="bg-[#f7f5ef]">
    <section className="relative overflow-hidden bg-[#0d1b3e] pb-14 pt-36 text-white md:pb-20 md:pt-44">
      <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full border border-[#e7ca83]/15" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-4 top-20 h-80 w-80 rounded-full border border-[#e7ca83]/10" aria-hidden="true" />
      <div className="container relative px-5 md:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e7ca83]">Giving at KDC Uganda</p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-white md:text-6xl">A generous heart.<br /><span className="text-[#e7ca83]">A lasting impact.</span></h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-white/75">Partner with Kingdom Deliverance Centre Uganda in worship, prayer and sharing the Gospel. Every gift is given with purpose.</p>
      </div>
    </section>
    <section aria-label="Give online" className="py-10 md:py-16">
      <div className="container grid items-start gap-7 px-5 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
        <aside className="space-y-6 lg:sticky lg:top-32">
          <div className="rounded-3xl bg-[#0d1b3e] p-7 text-white md:p-9">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7ca83]/15 text-[#e7ca83]"><HandHeart aria-hidden="true" /></span>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Your gift</p>
            <p data-testid="gift-summary" aria-live="polite" aria-atomic="true" className="mt-3 break-words text-3xl font-semibold tracking-tight text-[#e7ca83] md:text-4xl">{validAmount ? formatDonation(amount, form.currency) : 'Make a difference.'}</p>
            <p className="mt-4 text-sm leading-7 text-white/70">{validAmount ? `Estimated payment: ${formatDonation(ugxAmount, 'UGX')}.` : 'Choose an amount to support the life and ministry of our church.'}</p>
            <div className="mt-7 border-t border-white/15 pt-6 text-sm leading-7 text-white/70"><LockKeyhole size={17} className="mb-3 text-[#e7ca83]" aria-hidden="true" />Payments are processed by Pesapal in Uganda shillings (UGX). Review your payment details on the next screen.</div>
          </div>
          <div className="rounded-2xl border border-[#0d1b3e]/10 bg-white p-6">
            <p className="text-sm font-semibold text-[#0d1b3e]">Ways to pay</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600"><span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2"><Smartphone size={15} aria-hidden="true" /> MTN & Airtel Money</span><span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2"><CreditCard size={15} aria-hidden="true" /> Visa & Mastercard</span></div>
            <p className="mt-5 text-sm leading-6 text-slate-600">Interested in serving or becoming a ministry partner?</p>
            <Link href="/contact" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#0d1b3e]">Talk with our team <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
          <p className="px-2 text-sm italic leading-7 text-slate-600">“God loveth a cheerful giver.” <span className="whitespace-nowrap not-italic">— 2 Corinthians 9:7, KJV</span></p>
        </aside>
        <div className="min-w-0 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-9">
          <div className="mb-7 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#806125]">Give with purpose</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0d1b3e]">Make your gift</h2></div><Heart className="mt-2 shrink-0 text-[#947332]" size={26} aria-hidden="true" /></div>
          <form onSubmit={handleSubmit}>
            <fieldset disabled={loading} className="min-w-0 space-y-6">
              <div><label htmlFor="currency" className={labelClass}>Choose your currency</label><select id="currency" value={form.currency} onChange={e => changeCurrency(e.target.value)} className={inputClass}>{SUPPORTED_CURRENCIES.map(code => <option key={code} value={code}>{code} — {CURRENCY_NAMES[code]}</option>)}</select></div>
              <div><p id="quick-amount-label" className={labelClass}>Quick amounts · {form.currency}</p><div role="group" aria-labelledby="quick-amount-label" className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">{presets.map((value, index) => <button key={PRESETS_UGX[index]} type="button" aria-pressed={validAmount && amount === value} onClick={() => choosePreset(index)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#e7ca83] ${validAmount && amount === value ? 'border-[#0d1b3e] bg-[#0d1b3e] text-white' : 'border-slate-200 bg-slate-50 text-[#0d1b3e] hover:border-[#947332] hover:bg-[#f8f3e6]'}`}>{formatDonation(value, form.currency)}</button>)}</div></div>
              <div><label htmlFor="amount" className={labelClass}>Or enter an amount <span className="font-normal text-slate-500">({form.currency})</span></label><input id="amount" type="number" inputMode="decimal" min={digits === 0 ? 1 : 0.01} step={digits === 0 ? 1 : 0.01} required placeholder="Enter your gift amount" value={form.amount} onChange={e => changeAmount(e.target.value)} className={inputClass} aria-describedby="currency-help" /><p id="currency-help" className="mt-2 text-xs leading-5 text-slate-500">Changing currency converts your gift and the quick amounts using the site exchange rates.</p></div>
              <div className="border-t border-slate-100 pt-6"><label htmlFor="anonymous" className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-[#0d1b3e]"><input type="checkbox" id="anonymous" checked={form.is_anonymous} onChange={e => setForm(f => ({...f, is_anonymous:e.target.checked}))} className="h-5 w-5 rounded accent-[#0d1b3e]" />Give anonymously</label></div>
              {!form.is_anonymous && <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="donor-name" className={labelClass}>Full name <span className="font-normal text-slate-500">(optional)</span></label><input id="donor-name" autoComplete="name" value={form.donor_name} onChange={e => setForm(f => ({...f, donor_name:e.target.value}))} placeholder="Your name" className={inputClass} /></div><div><label htmlFor="donor-email" className={labelClass}>Email address <span className="text-rose-600">*</span></label><input id="donor-email" type="email" autoComplete="email" required value={form.donor_email} onChange={e => setForm(f => ({...f, donor_email:e.target.value}))} placeholder="you@example.com" className={inputClass} /></div></div>}
              <div><label htmlFor="notes" className={labelClass}>A note with your gift <span className="font-normal text-slate-500">(optional)</span></label><textarea id="notes" rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} placeholder="Tithe, offering or a message to our team…" className={`${inputClass} resize-y`} /></div>
              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
              <button type="submit" disabled={loading} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#e7ca83] px-4 py-4 text-sm font-semibold text-[#0d1b3e] transition hover:bg-[#dcc078] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#0d1b3e] disabled:opacity-60">{loading ? <><Loader2 size={18} className="animate-spin" />Opening payment…</> : <>Continue to Pesapal<ArrowUpRight size={19} aria-hidden="true" /></>}</button>
              <p className="flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500"><LockKeyhole size={14} className="shrink-0" aria-hidden="true" />You’ll review and complete your payment with Pesapal.</p>
            </fieldset>
          </form>
        </div>
      </div>
    </section>
  </div>;
}
