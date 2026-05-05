'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '@/lib/utils'
import { AddToCartButton } from './add-to-cart-button'
import { useScroll, useMotionValueEvent } from 'framer-motion'
import { useCurrency } from '@/lib/currency-context'

interface StickyAddToCartProps {
  product: any
  price: number
}

export function StickyAddToCart({ product, price }: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const { scrollY } = useScroll()
  const { formatPrice } = useCurrency()

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Show after scrolling past the main buy box (roughly 800px)
    setIsVisible(latest > 800)
  })

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-2xl border-t border-primary/10 z-[60] py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
        >
          <div className="container px-4 mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="size-12 rounded-lg overflow-hidden border bg-muted shrink-0 hidden sm:block">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary truncate">{product.name}</p>
                <p className="text-xs font-black text-accent tracking-tighter">{formatPrice(price)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <AddToCartButton 
                product={{...product, price_usd: price}} 
                className="h-12 sm:h-14 px-6 sm:px-10 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
