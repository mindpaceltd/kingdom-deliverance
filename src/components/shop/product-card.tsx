'use client'

import React from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Package, Tag } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

interface ProductCardProps {
  product: any
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
  const displayPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: product.id,
      name: product.name,
      price: displayPrice,
      quantity: 1,
      image: product.image_url,
      type: product.type
    })
  }

  return (
    <div className="group flex flex-col bg-white rounded-3xl border border-border overflow-hidden hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-500">
      {/* Image Container */}
      <Link href={`/shop/${product.slug}`} className="relative aspect-[4/5] overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.image_alt || product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Type Badge */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border",
            product.type === 'digital' 
              ? "bg-blue-500/10 border-blue-500/20 text-blue-600" 
              : "bg-green-500/10 border-green-500/20 text-green-600"
          )}>
            {product.type === 'digital' ? 'Digital' : 'Physical'}
          </span>
          
          {hasDiscount && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white shadow-lg animate-pulse">
              Sale
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">
            {product.category?.name || 'Store'}
          </p>
          <Link href={`/shop/${product.slug}`}>
            <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
          {product.short_description || product.description?.replace(/<[^>]*>?/gm, '').slice(0, 100)}
        </p>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border mt-auto">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through decoration-red-400">
                {formatPrice(product.regular_price_usd)}
              </span>
            )}
            <span className="text-2xl font-bold text-primary">
              {formatPrice(displayPrice)}
            </span>
          </div>
          <Button 
            onClick={handleAddToCart}
            size="icon" 
            className="rounded-xl h-11 w-11 shadow-lg shadow-primary/20"
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
