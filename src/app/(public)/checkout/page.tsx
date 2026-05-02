'use client'

import React, { useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOrder } from '@/lib/actions/orders'
import { Loader2, ShieldCheck, CreditCard, Wallet } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', rate: 1 },
  { code: 'UGX', name: 'Uganda Shilling', rate: 3800 },
  { code: 'KES', name: 'Kenya Shilling', rate: 130 },
  { code: 'RWF', name: 'Rwanda Franc', rate: 1250 },
  { code: 'GBP', name: 'British Pound', rate: 0.8 },
]

export default function CheckoutPage() {
  const { items, subtotal, totalItems } = useCart()
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState('USD')
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    country: 'Uganda',
  })

  const currentRate = CURRENCIES.find(c => c.code === currency)?.rate || 1
  const convertedTotal = subtotal * currentRate

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    setLoading(true)
    const result = await createOrder({
      ...formData,
      items,
      subtotal: convertedTotal,
      currency,
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
      <div className="pt-48 pb-32 text-center">
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <Button asChild><a href="/shop">Go back to shop</a></Button>
      </div>
    )
  }

  return (
    <div className="pt-32 pb-20 lg:pt-48 lg:pb-32 bg-muted/30 min-h-screen">
      <div className="container px-4">
        <h1 className="font-serif text-4xl font-bold text-primary mb-10">Checkout</h1>

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Shipping & Payment */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" /> Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    required 
                    placeholder="+256..." 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Payment Currency</Label>
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

            <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
              <h3 className="text-xl font-bold mb-6">Delivery Address</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input 
                    id="address" 
                    required 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      required 
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
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
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-8 border border-border shadow-xl shadow-primary/5 sticky top-32">
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>
              <div className="space-y-4 mb-8">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4 py-2 border-b border-border/50">
                    <div>
                      <p className="font-bold text-primary text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal (USD)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total To Pay</span>
                  <span className="text-accent">{formatPrice(convertedTotal, currency)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 rounded-2xl text-lg gap-2 shadow-xl shadow-accent/20 bg-accent hover:bg-accent/90 text-primary font-bold"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Pay with Flutterwave
                  </>
                )}
              </Button>

              <div className="mt-6 flex items-center justify-center gap-4 opacity-50">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
