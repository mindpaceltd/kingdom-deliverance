'use client'

import React, { useState, useEffect } from 'react'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { createBrowserClient } from '@supabase/ssr'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', rate: 1 },
  { code: 'UGX', name: 'Uganda Shilling', rate: 3800 },
  { code: 'KES', name: 'Kenya Shilling', rate: 130 },
  { code: 'RWF', name: 'Rwanda Franc', rate: 1250 },
  { code: 'GBP', name: 'British Pound', rate: 0.8 },
]

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

export default function CheckoutPage() {
  const { items, subtotal, totalItems } = useCart()
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState('UGX')
  const gateway = 'pesapal'
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    country: 'Uganda',
  })

  const allDigital = items.every(item => item.type === 'digital')
  const currentRate = CURRENCIES.find(c => c.code === currency)?.rate || 1
  const selectedShipping = SHIPPING_OPTIONS.find((option) => option.id === shippingMethod)
  const shippingCost = allDigital
    ? 0
    : Math.round((selectedShipping?.costUsd || 0) * currentRate * 100) / 100
  const taxRate = 0
  const taxAmount = Math.round((subtotal * currentRate * taxRate) * 100) / 100
  const convertedTotal = subtotal * currentRate
  const orderTotal = Math.round((convertedTotal + shippingCost + taxAmount) * 100) / 100

  // Pre-fill form if user is authenticated
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
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
    const result = await createOrder({
      ...formData,
      items,
      subtotal: convertedTotal,
      shippingMethod: allDigital ? undefined : shippingMethod,
      currency,
      gateway,
    })

    if (result.success && result.paymentUrl) {
      window.location.href = result.paymentUrl
    } else {
      alert(result.error || 'Something went wrong')
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
              <p className="text-xs text-gray-500 mb-4">No account required — checkout as a guest.</p>
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
                <div className="space-y-1.5">
                  <Label htmlFor="currency" className="text-sm font-semibold">Payment Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
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
                          {formatPrice(Math.round(option.costUsd * currentRate * 100) / 100, currency)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Payment Method</h3>
              <div className="rounded-2xl border border-[#1e3a5f] bg-[#1e3a5f]/5 p-4 text-sm text-gray-900">
                <p className="font-semibold">Pesapal</p>
                <p className="text-xs text-gray-600 mt-1">Secure payment via Pesapal for mobile money and card checkout.</p>
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
                    <span className="font-bold text-sm text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal (USD)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {currency !== 'USD' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Converted ({currency})</span>
                    <span className="font-medium">{formatPrice(convertedTotal, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">{formatPrice(shippingCost, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxes</span>
                  <span className="font-medium">{formatPrice(taxAmount, currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-[#d4a017]">{formatPrice(orderTotal, currency)}</span>
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
                    Pay with Pesapal
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
