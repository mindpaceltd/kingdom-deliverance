'use client'

import React, { useState, useEffect } from 'react'
import { useCart } from '@/lib/cart-context'
import { useCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { createOrder } from '@/lib/actions/orders'
import { Loader2, ShieldCheck, Wallet, Package, Download } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient, getBrowserSession } from '@/lib/supabase/client'


const SHIPPING_OPTIONS = [
  {
    id: 'standard',
    label: 'Standard shipping',
    description: 'Delivered in 5–7 business days.',
    costUsd: 5,
  },
  {
    id: 'express',
    label: 'Express shipping',
    description: 'Delivered in 1–2 business days.',
    costUsd: 12,
  },
]

const PAYMENT_METHODS = [
  {
    id: 'pesapal',
    name: 'Mobile Money Payment',
    icon: '📱',
    description: 'Pay with mobile money or card',
  },
  {
    id: 'paypal',
    name: 'Pay with PayPal',
    icon: '🅿️',
    description: 'PayPal account or card',
  },
]

export default function CheckoutPage() {
  const { items, subtotal, totalItems } = useCart()
  const { currency, rate, rates, setCurrency, formatPrice } = useCurrency()
  const [loading, setLoading] = useState(false)
  const [gateway, setGateway] = useState<'pesapal' | 'paypal'>('pesapal')
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [createAccount, setCreateAccount] = useState(false)
  const [authError, setAuthError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    country: 'Uganda',
    password: '',
  })

  // Prevent hydration mismatch — only render price-dependent content after mount
  useEffect(() => { setMounted(true) }, [])

  const allDigital = items.every(item => item.type === 'digital')
  const selectedShipping = SHIPPING_OPTIONS.find((option) => option.id === shippingMethod)
  const shippingCost = allDigital
    ? 0
    : Math.round((selectedShipping?.costUsd || 0) * rate * 100) / 100
  const taxRate = 0
  const taxAmount = Math.round((subtotal * rate * taxRate) * 100) / 100
  const convertedTotal = subtotal * rate
  const orderTotal = Math.round((convertedTotal + shippingCost + taxAmount) * 100) / 100

  // Pre-fill form if user is authenticated
  useEffect(() => {
    const supabase = createClient()
    getBrowserSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      if (user) {
        setCurrentUser(user)
        setFormData(prev => ({
          ...prev,
          email: user.email || prev.email,
          name: user.user_metadata?.full_name || prev.name,
          phone: user.user_metadata?.phone || prev.phone,
        }))
      }
    })
  }, [])

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    setLoading(true)
    setAuthError('')

    const supabase = createClient()

    if (createAccount && !currentUser) {
      if (!formData.password || formData.password.length < 6) {
        setAuthError('Please choose a password with at least 6 characters.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
          },
        },
      })

      if (error) {
        setAuthError(error.message)
        setLoading(false)
        return
      }
    }

    const result = await createOrder({
      email: formData.email,
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      items,
      subtotal: convertedTotal,
      shippingMethod: allDigital ? undefined : shippingMethod,
      currency,
      gateway: gateway as 'pesapal' | 'paypal',
    })

    if (result.success && result.paymentUrl) {
      window.location.href = result.paymentUrl
    } else {
      alert(result.error || 'Something went wrong')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setAuthError('')

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/checkout`,
        },
      })
      if (error) {
        setAuthError(error.message)
        setLoading(false)
        return
      }
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      setAuthError(error?.message || 'Google login failed. Please try again.')
      setLoading(false)
    }
  }

  if (totalItems === 0) {
    return (
      <div className="pt-48 pb-32 text-center min-h-screen bg-gray-50">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add some items to get started.</p>
        <Button asChild><a href="/shop">Browse Shop</a></Button>
      </div>
    )
  }

  return (
    <div className="pt-28 pb-20 lg:pt-36 lg:pb-32 bg-gray-50 min-h-screen">
      <div className="container px-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Customer Info */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-900">
                <ShieldCheck className="w-5 h-5 text-[#d4a017]" /> Customer Information
              </h3>
              {currentUser ? (
                <p className="text-xs text-gray-500 mb-4">You are signed in as <span className="font-semibold">{currentUser.email}</span>. Your order will use this account.</p>
              ) : (
                <div className="space-y-6 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">Checkout as a guest or create an account to track orders.</p>
                    <a href="/account/login?next=/checkout" className="text-xs font-bold text-[#1e3a5f] hover:underline">
                      Already have an account? Sign in
                    </a>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="rounded-xl h-11 border-gray-200 hover:bg-gray-50 font-bold gap-3 transition-all active:scale-[0.98]"
                    >
                      <svg viewBox="0 0 24 24" className="size-5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-100"></span>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-white px-2 text-gray-400 font-black tracking-widest">Or Guest Checkout</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-semibold">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-semibold">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+256..."
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                {!currentUser && (
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={e => setCreateAccount(e.target.checked)}
                        className="h-4 w-4 rounded border-muted-foreground text-primary focus:ring-primary"
                      />
                      Create an account with this email
                    </label>
                    {createAccount && (
                      <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm font-semibold">Password *</Label>
                        <PasswordInput
                          id="password"
                          required
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground">An account will be created so you can track orders and downloads.</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="currency" className="text-sm font-semibold">Payment Currency</Label>
                  <Select value={currency} onValueChange={(value) => setCurrency(value ?? currency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map(code => (
                        <SelectItem key={code} value={code}>{code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Delivery Address - hidden for all-digital orders */}
            {!allDigital && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-5 text-gray-900">Delivery Address</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-sm font-semibold">Street Address *</Label>
                    <Input
                      id="address"
                      required
                      placeholder="123 Main St"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-sm font-semibold">City *</Label>
                      <Input
                        id="city"
                        required
                        placeholder="Kampala"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country" className="text-sm font-semibold">Country *</Label>
                      <Input
                        id="country"
                        required
                        value={formData.country}
                        onChange={e => setFormData({...formData, country: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {allDigital && (
              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-bold text-blue-900">Digital Order</p>
                    <p className="text-xs text-blue-700">No delivery address needed. You&apos;ll receive download links via email after payment.</p>
                  </div>
                </div>
              </div>
            )}
            {authError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {authError}
              </div>
            )}

            {!allDigital && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Shipping Options</h3>
                <div className="space-y-3">
                  {SHIPPING_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setShippingMethod(option.id as 'standard' | 'express')}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        shippingMethod === option.id
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{option.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatPrice(option.costUsd)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Payment Method</h3>
              <div className="grid grid-cols-1 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setGateway(method.id as 'pesapal' | 'paypal')}
                    className={`rounded-2xl border p-4 transition-all text-left ${
                      gateway === method.id
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{method.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{method.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm sticky top-28">
              <h3 className="text-lg font-bold mb-5 text-gray-900">Order Summary</h3>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-3 py-2 border-b border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400 uppercase">
                        {item.type === 'digital' ? '📥 Digital' : '📦 Physical'} · Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-sm text-gray-900" suppressHydrationWarning>
                      {mounted ? (item.price === 0 ? 'Free' : formatPrice(item.price * item.quantity)) : '...'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium" suppressHydrationWarning>{mounted ? formatPrice(subtotal) : '...'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium" suppressHydrationWarning>
                    {mounted ? (allDigital || shippingCost === 0 ? 'Free' : formatPrice(selectedShipping?.costUsd || 0)) : '...'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxes</span>
                  <span className="font-medium" suppressHydrationWarning>{mounted ? formatPrice(0) : '...'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                  <span>Total ({currency})</span>
                  <span className="text-[#d4a017]" suppressHydrationWarning>
                    {mounted ? formatPrice(subtotal + (allDigital ? 0 : (selectedShipping?.costUsd || 0))) : '...'}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-sm gap-2 bg-[#d4a017] hover:bg-[#b88a12] text-white font-bold uppercase tracking-wide"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Continue to Payment
                  </>
                )}
              </Button>

              <p className="text-center text-[11px] text-gray-400 mt-3">
                🔒 Your payment is secure and encrypted
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
