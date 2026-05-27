'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Flame, ArrowRight, ArrowLeft, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { getUserCreditBalance, getCreditPackages, getCreditPricingContext, getServicePricing, purchaseCredits, purchaseCustomCredits, type CreditPackageWithPricing } from '@/lib/actions/credits'
import { gbpToUsdAmount } from '@/lib/credits/pricing'
import { useCurrency } from '@/lib/currency-context'
import { submitFireServiceRequest } from '@/lib/actions/fire-service'
import { countries, Country } from '@/lib/countries'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { createClient } from '@/lib/supabase/client'

// Steps
type Step = 1 | 2 | 3 | 4

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

const PRAYER_AREAS = [
  'Delay & Stagnation',
  'Financial Breakthrough',
  'Career / Job Stability',
  'Marriage & Relationships',
  'Legal Battles / Court Cases',
  'Health & Healing',
  'Witchcraft / Spiritual Attacks',
  'Generational Curses',
  'Business Breakthrough',
  'Restoration of Lost Opportunities',
]

const CUSTOM_SEED_ID = 'custom'

/** Chapter number from reference (Ps 27:1 → 27, Isaiah 54:17 → 54, Psalms 68 → 68). */
function seedCreditsFromDescription(desc: string): number {
  const chapter = desc.match(/(?:Psalms?|Ps|Isaiah)\s+(\d+)\b/i)
  if (chapter) return Math.max(1, parseInt(chapter[1], 10))
  return 1
}

const SEED_PACKAGE_DEFS = [
  { id: 'light', name: 'LIGHT & SALVATION SEED', desc: 'Ps 27:1 The Lord is my light and my salvation — whom shall I fear? To break fear, confusion, and darkness.' },
  { id: 'victory', name: 'NO WEAPON VICTORY SEED', desc: 'Isaiah 54:17 No weapon formed against me shall prosper. To cancel attacks, witchcraft, and spiritual opposition.' },
  { id: 'fire', name: 'CONSUMING FIRE SEED', desc: 'Psalms 68 Let God arise, let His enemies be scattered. To destroy stubborn enemies and spiritual resistance.' },
  { id: 'protection', name: 'DIVINE PROTECTION SEED', desc: 'Psalms 91 To secure protection, preservation, and covering. To break cycles of danger.' },
  { id: 'total', name: 'TOTAL VICTORY & RESTORATION SEED', desc: 'Ps 108:13 Through God we will do valiantly. To recover lost opportunities, restore what was stolen.' },
] as const

const SEED_PACKAGES = SEED_PACKAGE_DEFS.map((pkg) => ({
  ...pkg,
  credits: seedCreditsFromDescription(pkg.desc),
}))

export function FireServiceForm() {
  const { formatPrice, rates } = useCurrency()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [creditBalance, setCreditBalance] = useState<number>(0)
  const [balanceLoaded, setBalanceLoaded] = useState(false)
  const [serviceCost, setServiceCost] = useState<number>(270)
  const [packages, setPackages] = useState<CreditPackageWithPricing[]>([])
  const [pricePerCreditGbp, setPricePerCreditGbp] = useState(1)
  const [showPackages, setShowPackages] = useState(false)

  const formatCreditsAsMoney = (credits: number) => {
    const gbpTotal = credits * pricePerCreditGbp
    return formatPrice(gbpToUsdAmount(gbpTotal, rates))
  }
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: 'Uganda',
    countryCode: 'UG',
    phone: '+256',
    attendance: 'online', // online, in_person
    focusAreas: [] as string[],
    details: '',
    selectedSeedId: SEED_PACKAGES[0].id,
    selectedSeed: SEED_PACKAGES[0].credits,
    customSeedAmount: '',
  })
  const [countryOpen, setCountryOpen] = useState(false)
  const [accountPrefilled, setAccountPrefilled] = useState(false)

  // Load pricing, packages, and prefill from logged-in account (or geo for guests)
  useEffect(() => {
    const supabase = createClient()

    async function loadData() {
      const [cost, pkgs, pricing] = await Promise.all([
        getServicePricing('fire_service'),
        getCreditPackages(),
        getCreditPricingContext(),
      ])
      if (cost) setServiceCost(cost)
      setPackages(pkgs)
      setPricePerCreditGbp(pricing.settings.pricePerCreditGbp)

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, phone')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.warn('[FireServiceForm] Profile fetch failed:', profileError.message)
        }

        const displayName =
          (user.user_metadata?.full_name as string | undefined) ||
          profile?.name ||
          ''
        const { firstName, lastName } = splitFullName(displayName)
        const phone =
          (user.user_metadata?.phone as string | undefined) ||
          profile?.phone ||
          ''

        setForm(f => ({
          ...f,
          firstName: firstName || f.firstName,
          lastName: lastName || f.lastName,
          email: user.email || f.email,
          phone: phone || f.phone,
        }))
        setAccountPrefilled(true)
        return
      }

      // Guests only: try to detect country from IP
      fetch('https://get.geojs.io/v1/ip/country.json')
        .then(res => res.json())
        .then(data => {
          if (data.country) {
            const detectedCountry = countries.find(c => c.code === data.country)
            if (detectedCountry) {
              setForm(f => ({
                ...f,
                country: detectedCountry.name,
                countryCode: detectedCountry.code,
                phone: detectedCountry.dial_code,
              }))
            }
          }
        })
        .catch(() => {
          // Fallback to Uganda is already set in initial state
        })
    }

    loadData()
  }, [])

  // Check balance when email changes or step 4 is reached
  useEffect(() => {
    if (form.email && form.email.includes('@')) {
      setBalanceLoaded(false)
      getUserCreditBalance(form.email).then((bal) => {
        setCreditBalance(bal)
        setBalanceLoaded(true)
      })
    }
  }, [form.email, step])

  // If the user is on Step 4 and doesn't have enough credits, open the "Buy Credits" picker immediately.
  useEffect(() => {
    if (
      step === 4 &&
      balanceLoaded &&
      form.selectedSeed > 0 &&
      creditBalance < form.selectedSeed
    ) {
      setShowPackages(true)
    }
  }, [step, balanceLoaded, creditBalance, form.selectedSeed])

  const nextStep = () => {
    if (step === 1 && (!form.firstName || !form.email)) return
    setStep(s => Math.min(s + 1, 4) as Step)
  }
  const prevStep = () => setStep(s => Math.max(s - 1, 1) as Step)

  const handleToggleArea = (area: string) => {
    setForm(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }))
  }

  const handleBuyCredits = async (packageId: string) => {
    if (!form.email) {
      setError("Please enter your email in Step 1 first.")
      setStep(1)
      return
    }
    setLoading(true)
    const result = await purchaseCredits({ email: form.email, packageId })
    if (result.success && result.paymentUrl) {
      window.location.href = result.paymentUrl
    } else {
      setError(result.error || "Failed to initiate payment.")
      setLoading(false)
    }
  }

  const handleBuyCustomCredits = async (credits: number) => {
    if (!form.email) {
      setError("Please enter your email in Step 1 first.")
      setStep(1)
      return
    }
    setLoading(true)
    const result = await purchaseCustomCredits({ email: form.email, credits })
    if (result.success && result.paymentUrl) {
      window.location.href = result.paymentUrl
    } else {
      setError(result.error || "Failed to initiate payment.")
      setLoading(false)
    }
  }

  const handleFinalSubmit = async (method: 'credits' | 'vow') => {
    if (form.selectedSeed < 1) {
      setError(
        form.selectedSeedId === CUSTOM_SEED_ID
          ? 'Please enter how many credits you want to give for your custom seed.'
          : 'Please select a seed offering before submitting.'
      )
      return
    }
    setLoading(true)
    setError(null)
    const result = await submitFireServiceRequest({
      ...form,
      paymentMethod: method,
    })
    
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || "Submission failed.")
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-[#111A30] rounded-2xl p-10 border border-white/10 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-white">Request Submitted!</h2>
        <p className="text-white/70 max-w-md mx-auto">
          Your Fire List has been received. Your case will be carried into the Fire Altar tonight. Keep believing for your breakthrough.
        </p>
        <Button onClick={() => window.location.reload()} className="bg-accent text-primary font-bold px-8">
          Submit Another Request
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-[#111A30] rounded-2xl p-6 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500" />
      
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
          Fire Service Prayer
        </h2>
        <p className="text-accent text-sm md:text-base font-medium tracking-wide">
          Global Fire Altar · 10:00 PM — 12:00 Midnight
        </p>
      </div>

      <div className="flex justify-between items-center mb-8 relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-white/10 -z-10" />
        {[1, 2, 3, 4].map(num => (
          <div 
            key={num} 
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              step >= num ? 'bg-accent text-[#111A30]' : 'bg-[#1D2845] text-white/50'
            }`}
          >
            {num}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-white mb-4">Step 1: Personal Details</h3>
            <p className="text-sm text-white/70 mb-6">This is your prophetic agreement to enter your case into the FIRE ALTAR. What you submit here will be presented before God.</p>
            {accountPrefilled && (
              <p className="text-sm text-accent/90 bg-accent/10 border border-accent/20 rounded-lg px-4 py-3 mb-2">
                We&apos;ve filled in your account details below. You can edit any field before continuing.
              </p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="bg-[#1D2845] border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="bg-[#1D2845] border-white/10" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-[#1D2845] border-white/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={countryOpen}
                      className="w-full justify-between bg-[#1D2845] border-white/10 text-white hover:bg-[#1D2845]/80 hover:text-white"
                    >
                      <span className="truncate">
                        {form.country
                          ? countries.find((c) => c.name === form.country)?.flag + " " + form.country
                          : "Select country..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-[#1D2845] border-white/10" align="start">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Search country..." className="text-white h-9" />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {countries.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={c.name}
                              onSelect={(currentValue) => {
                                setForm({
                                  ...form,
                                  country: currentValue,
                                  countryCode: c.code,
                                  phone: c.dial_code
                                })
                                setCountryOpen(false)
                              }}
                              className="text-white hover:bg-accent/20 cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.country === c.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="mr-2">{c.flag}</span>
                              {c.name}
                              <span className="ml-auto text-xs text-white/40">{c.dial_code}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input 
                  required 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})} 
                  className="bg-[#1D2845] border-white/10" 
                  placeholder="+256 ..." 
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Attendance */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-white mb-4">Step 2: Attendance</h3>
            <Label className="mb-4 block">How Will You Be Attending? *</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setForm({...form, attendance: 'in_person'})}
                className={`p-6 rounded-xl border-2 text-left transition-all ${form.attendance === 'in_person' ? 'border-accent bg-accent/10' : 'border-white/10 bg-[#1D2845] hover:border-white/30'}`}
              >
                <h4 className="font-bold text-lg text-white">In Person</h4>
                <p className="text-sm text-white/60">Join us at the venue</p>
              </button>
              
              <button
                type="button"
                onClick={() => setForm({...form, attendance: 'online'})}
                className={`p-6 rounded-xl border-2 text-left transition-all ${form.attendance === 'online' ? 'border-accent bg-accent/10' : 'border-white/10 bg-[#1D2845] hover:border-white/30'}`}
              >
                <h4 className="font-bold text-lg text-white">Online</h4>
                <p className="text-sm text-white/60">Join via livestream</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Prayer Focus */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-white mb-2">Step 3: Prayer Focus (Fire List)</h3>
            <p className="text-sm text-red-400 font-bold bg-red-500/10 p-3 rounded-lg flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Write clearly and specifically. Be direct. This is what will be taken into the fire.</span>
            </p>

            <div className="space-y-3 mt-6">
              <Label>Select Your Prayer Focus Areas *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {PRAYER_AREAS.map(area => (
                  <div key={area} className="flex items-center space-x-3 bg-[#1D2845] p-3 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5" onClick={() => handleToggleArea(area)}>
                    <Checkbox 
                      checked={form.focusAreas.includes(area)}
                      onCheckedChange={() => handleToggleArea(area)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm text-white">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your Prayer Request *</Label>
              <Textarea 
                required 
                value={form.details} 
                onChange={e => setForm({...form, details: e.target.value})} 
                className="bg-[#1D2845] border-white/10 min-h-[120px]" 
                placeholder="Describe your prayer request in detail..." 
              />
            </div>
          </div>
        )}

        {/* STEP 4: Seed Offering */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xl font-bold text-white">Step 4: Seed Offering</h3>
              <div className="text-right">
                <p className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1">Your Balance</p>
                <p className="text-lg font-bold text-green-400">{creditBalance} Credits</p>
              </div>
            </div>

            <div className="space-y-3">
              {SEED_PACKAGES.map(pkg => {
                const isSelected = form.selectedSeedId === pkg.id
                return (
                  <div
                    key={pkg.id}
                    role="radio"
                    aria-checked={isSelected}
                    className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-accent bg-accent/10' : 'border-white/10 bg-[#1D2845] hover:border-white/30'
                    }`}
                    onClick={() =>
                      setForm({
                        ...form,
                        selectedSeedId: pkg.id,
                        selectedSeed: pkg.credits,
                      })
                    }
                  >
                    <div className="flex gap-4 items-start pr-4">
                      <div
                        className={`mt-1 flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 ${
                          isSelected ? 'border-accent' : 'border-white/30'
                        }`}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{pkg.name}</h4>
                        <p className="text-xs text-white/60 mt-1">{pkg.desc}</p>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 font-bold text-lg text-accent whitespace-nowrap pl-9 md:pl-0">
                      {pkg.credits} Credits
                    </div>
                  </div>
                )
              })}

              {/* Custom seed offering */}
              <div
                role="radio"
                aria-checked={form.selectedSeedId === CUSTOM_SEED_ID}
                className={`flex flex-col gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.selectedSeedId === CUSTOM_SEED_ID
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 bg-[#1D2845] hover:border-white/30'
                }`}
                onClick={() => {
                  const parsed = parseInt(form.customSeedAmount, 10)
                  setForm({
                    ...form,
                    selectedSeedId: CUSTOM_SEED_ID,
                    selectedSeed: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
                  })
                }}
              >
                <div className="flex gap-4 items-start">
                  <div
                    className={`mt-1 flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 ${
                      form.selectedSeedId === CUSTOM_SEED_ID ? 'border-accent' : 'border-white/30'
                    }`}
                  >
                    {form.selectedSeedId === CUSTOM_SEED_ID && (
                      <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white">CUSTOM SEED OFFERING</h4>
                    <p className="text-xs text-white/60 mt-1">
                      Choose your own seed amount in credits — as the Lord leads you.
                    </p>
                  </div>
                </div>
                <div
                  className="pl-9 md:pl-14"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Label htmlFor="custom-seed-credits" className="text-xs text-white/70">
                    Credits to give
                  </Label>
                  <Input
                    id="custom-seed-credits"
                    type="number"
                    min={1}
                    placeholder="e.g. 50"
                    value={form.customSeedAmount}
                    onChange={(e) => {
                      const value = e.target.value
                      const parsed = parseInt(value, 10)
                      setForm({
                        ...form,
                        customSeedAmount: value,
                        selectedSeedId: CUSTOM_SEED_ID,
                        selectedSeed:
                          Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
                      })
                    }}
                    onFocus={() => {
                      const parsed = parseInt(form.customSeedAmount, 10)
                      setForm({
                        ...form,
                        selectedSeedId: CUSTOM_SEED_ID,
                        selectedSeed:
                          Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
                      })
                    }}
                    className="mt-1.5 bg-[#1D2845] border-white/10 max-w-[200px]"
                  />
                  {form.selectedSeedId === CUSTOM_SEED_ID && form.selectedSeed > 0 && (
                    <p className="text-sm font-bold text-accent mt-2">
                      {form.selectedSeed} Credits
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#1D2845] p-6 rounded-xl border border-white/10 mt-6">
              <h4 className="font-bold mb-4 text-white text-center md:text-left">
                Complete Submission ({form.selectedSeed > 0 ? form.selectedSeed : '—'} Credits Required)
              </h4>
              
              {creditBalance >= form.selectedSeed && form.selectedSeed > 0 ? (
                <Button 
                  onClick={() => handleFinalSubmit('credits')}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-12"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Submit Request & Deduct {form.selectedSeed} Credits
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-red-400 font-medium text-center md:text-left">
                    {form.selectedSeed < 1
                      ? '⚠️ Select a seed offering and enter a valid credit amount to continue.'
                      : `⚠️ You need ${form.selectedSeed - creditBalance} more credits to submit this request.`}
                  </p>
                  
                  {showPackages ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      {form.selectedSeed > creditBalance && (
                        <Button
                          type="button"
                          onClick={() =>
                            handleBuyCustomCredits(form.selectedSeed - creditBalance)
                          }
                          disabled={loading}
                          className="w-full h-auto py-4 flex flex-col gap-1 bg-accent hover:bg-accent/90 text-[#111A30] font-bold"
                        >
                          <span className="text-lg">
                            Buy {form.selectedSeed - creditBalance} Credits (exact amount needed)
                          </span>
                          <span className="text-xs opacity-80">
                            {formatCreditsAsMoney(form.selectedSeed - creditBalance)} · £
                            {(form.selectedSeed - creditBalance) * pricePerCreditGbp} GBP
                          </span>
                        </Button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {packages.map(pkg => (
                        <Button 
                          key={pkg.id} 
                          onClick={() => handleBuyCredits(pkg.id)}
                          disabled={loading}
                          variant="outline" 
                          className="h-auto py-4 flex flex-col gap-1 border-white/10 bg-[#1D2845] hover:bg-accent hover:text-primary transition-all"
                        >
                          <span className="font-bold text-lg">{pkg.credits_amount} Credits</span>
                          <span className="text-xs opacity-70">
                            {formatCreditsAsMoney(pkg.credits_amount)} · £{pkg.gbp_total.toFixed(2)} GBP
                          </span>
                        </Button>
                      ))}
                      </div>
                      <Button variant="ghost" onClick={() => setShowPackages(false)} className="w-full text-white/50 text-xs">Cancel</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        onClick={() => setShowPackages(true)}
                        className="w-full bg-accent hover:bg-accent/90 text-[#111A30] font-bold h-12"
                      >
                        Buy Credits
                      </Button>
                      <Button 
                        onClick={() => handleFinalSubmit('vow')}
                        disabled={loading}
                        className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/30 font-bold h-12 transition-all"
                      >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Submit as a Vow"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 mt-6 border-t border-white/10">
          {step > 1 ? (
            <Button type="button" variant="ghost" onClick={prevStep} disabled={loading} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          ) : <div></div>}
          
          {step < 4 ? (
            <Button onClick={nextStep} disabled={loading} className="bg-white text-[#111A30] hover:bg-white/90 font-bold px-8">
              Next Step <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
