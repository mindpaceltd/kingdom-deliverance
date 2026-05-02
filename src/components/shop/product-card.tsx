'use client'

import React from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Star, Package } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

interface ProductCardProps {
  product: any
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
  const displayPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)
  // Convert USD to UGX for display (1 USD = 3800 UGX)
  const RATE = 3800
  const priceUGX = Math.round(displayPrice * RATE)
  const regularUGX = Math.round((product.regular_price_usd || product.price_usd) * RATE)

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

  const typeLabel = product.type === 'digital' ? 'DIGITAL' : 'AUDIO'

  return (
    <div className="group flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Image Container */}
      <Link href={`/shop/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-gray-100 block">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.image_alt || product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Badges - top left, exactly as in design */}
        <div className="absolute top-0 left-0 flex flex-col gap-0">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 leading-none">
              SALE!
            </span>
          )}
        </div>
        <div className="absolute top-0 right-0">
          <span className="bg-[#1e3a5f] text-white text-[9px] font-bold uppercase px-2 py-1 leading-none block">
            {typeLabel}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        <p className="text-[11px] text-gray-400 mb-1">{product.category?.name || '30 Days Series'}</p>

        {/* Title */}
        <Link href={`/shop/${product.slug}`}>
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#d4a017] transition-colors line-clamp-2 leading-snug mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-[#f5a623] text-[#f5a623]" />
          ))}
          <span className="text-[11px] text-gray-400 ml-1">({product.review_count || Math.floor(Math.random() * 30) + 5})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-black text-gray-900">
            UGX {priceUGX.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              UGX {regularUGX.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to Cart Button - full width, gold/yellow, exactly as in design */}
        <button
          onClick={handleAddToCart}
          className="w-full flex items-center justify-center gap-2 bg-[#d4a017] hover:bg-[#b88a12] text-white text-[12px] font-bold uppercase tracking-wide py-2.5 rounded transition-colors duration-200 mt-auto"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Add to Cart
        </button>
      </div>
    </div>
  )
}
