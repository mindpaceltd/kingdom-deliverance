'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  image_url: string
  price_usd: number
  regular_price_usd: number
  sale_price_usd: number
  short_description: string
  type: 'digital' | 'physical'
}

interface ProductCarouselProps {
  products: Product[]
  title?: string
  subtitle?: string
}

export function ProductCarousel({ products, title = "Featured Products", subtitle = "Discover resources to enrich your spiritual journey" }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || products.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length)
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, products.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)
    setIsAutoPlaying(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length)
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  if (!products || products.length === 0) {
    return null
  }

  const currentProduct = products[currentIndex]
  const hasDiscount = currentProduct.sale_price_usd > 0 && currentProduct.sale_price_usd < currentProduct.regular_price_usd
  const displayPrice = hasDiscount ? currentProduct.sale_price_usd : (currentProduct.regular_price_usd || currentProduct.price_usd)
  const ugxPrice = Math.round(displayPrice * 3800)

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container px-4">
        {/* Header */}
        <div className="mb-14 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <ShoppingCart className="h-3.5 w-3.5" />
            KDC Store
          </div>
          <h2 className="text-4xl font-bold md:text-5xl font-serif text-primary">{title}</h2>
          <p className="text-base text-primary/60 max-w-xl mx-auto md:text-lg">{subtitle}</p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Product Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
              {/* Product Image */}
              <div className="relative bg-gray-100">
                <img
                  src={currentProduct.image_url}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    SALE!
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-[#1e3a5f] text-white text-xs font-bold px-2 py-1 rounded">
                  {currentProduct.type === 'digital' ? 'DIGITAL' : 'PHYSICAL'}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-8 flex flex-col justify-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-primary leading-tight">
                    {currentProduct.name}
                  </h3>

                  {currentProduct.short_description && (
                    <p className="text-gray-600 leading-relaxed">
                      {currentProduct.short_description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        UGX {ugxPrice.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-lg text-gray-400 line-through">
                          UGX {Math.round(currentProduct.regular_price_usd * 3800).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {hasDiscount && (
                      <p className="text-sm text-green-600 font-semibold">
                        Save {Math.round((1 - currentProduct.sale_price_usd / currentProduct.regular_price_usd) * 100)}%
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button asChild className="flex-1 bg-[#d4a017] hover:bg-[#b88a12] text-white">
                      <Link href={`/shop/${currentProduct.slug}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link href="/shop">
                        Browse All
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {products.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                aria-label="Previous product"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                aria-label="Next product"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {products.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-[#d4a017] scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to product ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-8">
            <Link href="/shop">
              View All Products
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}