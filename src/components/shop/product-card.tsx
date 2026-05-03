'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingCart, Star, Package, ArrowRight } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface ProductCardProps {
  product: any
  view?: 'grid' | 'list'
}

export function ProductCard({ product, view = 'grid' }: ProductCardProps) {
  const { addItem } = useCart()

  const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
  const displayPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)
  const RATE = 3800
  const priceUGX = Math.round(displayPrice * RATE)
  const regularUGX = Math.round((product.regular_price_usd || product.price_usd) * RATE)

  const router = useRouter()
  const handleAddToCart = (e: React.MouseEvent, isBuy: boolean = false) => {
    e.preventDefault()
    e.stopPropagation()
    
    addItem({
      id: product.id,
      name: product.name,
      price: displayPrice,
      quantity: 1,
      image: product.image_url,
      type: product.type
    })

    if (isBuy) {
      router.push('/checkout')
    }
  }

  if (view === 'list') {
    return (
      <div className="group flex bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-40 md:h-48">
        <Link href={`/shop/${product.slug}`} className="relative w-32 md:w-48 shrink-0 overflow-hidden bg-gray-50">
          <img
            src={product.image_url || '/placeholder.png'}
            alt={product.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              SALE
            </div>
          )}
        </Link>
        <div className="p-4 flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-center justify-between gap-4 mb-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{product.category?.name || 'Store'}</p>
              <span className="text-[9px] font-bold text-primary/50 border border-primary/10 px-1.5 rounded uppercase">
                {product.type}
              </span>
            </div>
            <h3 className="text-sm md:text-base font-bold text-primary group-hover:text-accent transition-colors line-clamp-1">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1 hidden md:block">
              {product.short_description}
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-base md:text-lg font-black text-primary">
                  UGX {priceUGX.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {regularUGX.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
               <Button asChild variant="outline" size="sm" className="h-8 text-[10px] hidden sm:flex">
                <Link href={`/shop/${product.slug}`}>Details</Link>
              </Button>
              <Button onClick={(e) => handleAddToCart(e, false)} size="sm" className="h-8 bg-gray-100 hover:bg-gray-200 text-primary text-[10px] font-bold">
                <ShoppingCart className="w-3 h-3 mr-1.5" />
                Add
              </Button>
              <Button onClick={(e) => handleAddToCart(e, true)} size="sm" className="h-8 bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-[10px] font-bold">
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link href={`/shop/${product.slug}`} className="relative aspect-[4/5] overflow-hidden bg-gray-50 block">
        <img
          src={product.image_url || '/placeholder.png'}
          alt={product.name}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shadow-sm">
              SALE
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <span className="bg-primary/90 backdrop-blur-sm text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm">
            {product.type === 'digital' ? 'DIGITAL' : 'PHYSICAL'}
          </span>
        </div>
      </Link>

      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        <div className="mb-2">
          <p className="text-[9px] text-gray-400 uppercase tracking-tighter mb-0.5">{product.category?.name || 'General'}</p>
          <Link href={`/shop/${product.slug}`}>
            <h3 className="text-[12px] sm:text-sm font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 leading-tight">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-auto pt-2">
          <div className="flex flex-col gap-0.5 mb-3">
            <span className="text-sm sm:text-base font-black text-primary">
              UGX {priceUGX.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-gray-400 line-through leading-none">
                {regularUGX.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex gap-1">
            <Button 
              onClick={(e) => handleAddToCart(e, false)}
              size="sm" 
              variant="outline"
              className="flex-1 h-7 sm:h-8 border-primary/10 text-primary text-[9px] sm:text-[10px] font-bold px-1"
            >
              Add
            </Button>
            <Button 
              onClick={(e) => handleAddToCart(e, true)}
              size="sm" 
              className="flex-[1.5] h-7 sm:h-8 bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-[9px] sm:text-[10px] font-bold px-1"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
