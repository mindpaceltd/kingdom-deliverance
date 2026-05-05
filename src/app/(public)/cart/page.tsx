'use client'

import React from 'react'
import { useCart } from '@/lib/cart-context'
import { useCurrency } from '@/lib/currency-context'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart()
  const { formatPrice } = useCurrency()

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Shopping Cart</h1>
            <p className="text-muted-foreground mt-1">Review your ministry resources before checkout.</p>
          </div>
          <Button asChild variant="ghost" className="gap-2">
            <Link href="/shop">
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={item.id} 
                  className="bg-white rounded-3xl border border-gray-200 p-6 flex gap-4 sm:gap-6"
                >
                  <div className="h-24 w-20 rounded-2xl bg-muted overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-primary text-base sm:text-lg leading-tight">{item.name}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold bg-muted w-fit px-2 py-0.5 rounded-full">
                        {item.type}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center border rounded-xl overflow-hidden bg-gray-50 h-9">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-4 text-sm font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1.5 text-xs font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                      <p className="text-xs text-muted-foreground sm:mb-1">Price</p>
                      <p className="text-lg font-black text-primary">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="lg:col-span-4">
              <div className="bg-[#0d1b3e] text-white rounded-[2rem] p-8 sticky top-24 shadow-2xl">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  Order Summary
                </h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm opacity-70">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm opacity-70">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold">Total</span>
                      <div className="text-right">
                        <span className="text-3xl font-black text-accent">{formatPrice(subtotal)}</span>
                        <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1">Inclusive of VAT</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-primary text-lg font-black gap-2 group">
                  <Link href="/checkout">
                    Checkout Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="size-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-accent" />
                    </div>
                    <div className="text-[10px]">
                      <p className="font-bold uppercase tracking-widest">Secure Payment</p>
                      <p className="opacity-50">Processed via Pesapal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-gray-200 p-16 text-center shadow-sm">
            <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-8 border border-gray-100">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-primary mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-10 leading-relaxed">
              Looks like you haven't added any resources to your cart yet. Visit our shop to find life-changing materials.
            </p>
            <Button asChild className="rounded-2xl px-12 h-14 text-lg font-bold bg-[#0d1b3e] hover:bg-[#1e3a5f]">
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
