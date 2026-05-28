'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingCart, Star, Package, ArrowRight } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useCurrency } from '@/lib/currency-context'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { normalizeMediaUrl } from '@/lib/media-url'

interface ProductCardProps {
  product: any
  view?: 'grid' | 'list'
}

function ProductCardImage({ src, alt, className }: { src?: string | null; alt: string; className: string }) {
  const normalized = normalizeMediaUrl(src) || '/placeholder.png'
  return (
    <img
      src={normalized}
      alt={alt}
      className={className}
      onError={(e) => {
        const target = e.currentTarget
        if (!target.src.endsWith('/placeholder.png')) target.src = '/placeholder.png'
      }}
    />
  )
}

export function ProductCard({ product, view = 'grid' }: ProductCardProps) {
  const { addItem } = useCart()
  const { formatPrice, currency } = useCurrency()

  const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
  const displayPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)
  const isFree = displayPrice === 0

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
      router.push('/cart')
    }
  }

  if (view === 'list') {
    return (
      <div className="group flex bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-40 md:h-48">
        <Link href={`/shop/${product.slug}`} className="relative w-32 md:w-48 shrink-0 overflow-hidden bg-gray-50">
          <ProductCardImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              SALE
            </div>
          )}
        </Link>
        <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider truncate">{product.category?.name || 'Store'}</p>
              <span className="text-[8px] sm:text-[9px] font-bold text-primary/50 border border-primary/10 px-1 sm:px-1.5 py-0.5 rounded uppercase shrink-0">
                {product.type}
              </span>
            </div>
            <h3 className="text-sm md:text-base font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 md:line-clamp-1 leading-tight">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 mt-1.5 mb-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-[#f5a623] text-[#f5a623]" />
                ))}
              </div>
              <span className="text-[10px] text-gray-500">({product.review_count || 24})</span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1 hidden md:block">
              {product.short_description}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-auto gap-2 sm:gap-0 pt-2">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5 md:gap-2 flex-wrap">
                <span className="text-sm sm:text-base md:text-lg font-black text-primary" suppressHydrationWarning>
                  {isFree ? 'Free' : formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-[9px] sm:text-[10px] text-gray-400 line-through" suppressHydrationWarning>
                    {formatPrice(product.regular_price_usd || product.price_usd)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
               <Button asChild variant="outline" size="sm" className="h-7 md:h-8 px-2 text-[10px] hidden sm:flex">
                <Link href={`/shop/${product.slug}`}>Details</Link>
              </Button>
              <Button onClick={(e) => handleAddToCart(e, false)} size="sm" className="h-7 md:h-8 px-2 md:px-3 bg-gray-100 hover:bg-gray-200 text-primary text-[10px] font-bold">
                <ShoppingCart className="w-3 h-3 sm:mr-1.5" />
                <span className="hidden sm:inline">Add</span>
              </Button>
              <Button onClick={(e) => handleAddToCart(e, true)} size="sm" className="h-7 md:h-8 px-2 md:px-3 bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-[10px] font-bold flex-1 sm:flex-none">
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
        <ProductCardImage
          src={product.image_url}
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
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#f5a623] text-[#f5a623]" />
              ))}
            </div>
            <span className="text-[9px] sm:text-[10px] text-gray-500">({product.review_count || 24})</span>
          </div>
        </div>

        <div className="mt-auto pt-2">
          <div className="flex flex-col gap-0.5 mb-3">
            <span className="text-sm sm:text-base font-black text-primary" suppressHydrationWarning>
              {isFree ? 'Free' : formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-gray-400 line-through leading-none" suppressHydrationWarning>
                {formatPrice(product.regular_price_usd || product.price_usd)}
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
