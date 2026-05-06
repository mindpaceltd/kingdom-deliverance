'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useCurrency } from '@/lib/currency-context'
import Link from 'next/link'

export function CartSheet() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, subtotal, totalItems } = useCart()
  const { formatPrice } = useCurrency()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-white hover:text-accent transition-colors group">
          <ShoppingCart className="w-6 h-6" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-lg shadow-accent/30 animate-in zoom-in duration-300">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-[#080C18] border-l border-white/5 text-white">
        <SheetHeader className="p-6 border-b border-white/5">
          <SheetTitle className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-accent" />
            <span className="text-white">Your Shopping Bag</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {items.length > 0 ? (
            <div className="divide-y divide-white/5">
              {items.map((item) => (
                <div key={item.id} className="p-6 flex gap-4">
                  <div className="h-20 w-16 rounded-xl bg-white/5 overflow-hidden shrink-0 border border-white/5">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{item.type}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-white/10 rounded-lg overflow-hidden h-8 bg-white/5">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 hover:bg-white/10 transition-colors text-white/70"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 hover:bg-white/10 transition-colors text-white/70"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-sm text-accent">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="self-start text-white/20 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground text-sm mb-8">
                Looks like you haven't added any ministry resources yet.
              </p>
              <Button asChild className="rounded-xl px-8">
                <Link href="/shop">Start Shopping</Link>
              </Button>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-6">
              <span className="text-white/60 font-medium">Subtotal</span>
              <span className="text-2xl font-bold text-white">{formatPrice(subtotal)}</span>
            </div>
            <SheetClose asChild>
              <Button
                type="button"
                onClick={() => router.push('/checkout')}
                className="w-full h-14 rounded-2xl text-lg gap-2 bg-accent hover:bg-accent/90 text-primary font-bold shadow-xl shadow-accent/20"
              >
                Checkout Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </SheetClose>
            <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-widest font-bold">
              Secure Checkout via Pesapal
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
