'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const trackRef = useRef<HTMLDivElement | null>(null)
  const visibleCount = 5

  const maxIndex = Math.max(products.length - visibleCount, 0)

  useEffect(() => {
    setCurrentIndex(0)
    if (trackRef.current) {
      trackRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [products])

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
    if (!trackRef.current) return
    const step = trackRef.current.clientWidth / visibleCount
    trackRef.current.scrollBy({ left: -step, behavior: 'smooth' })
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
    if (!trackRef.current) return
    const step = trackRef.current.clientWidth / visibleCount
    trackRef.current.scrollBy({ left: step, behavior: 'smooth' })
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    if (!trackRef.current) return
    const step = trackRef.current.clientWidth / visibleCount
    trackRef.current.scrollTo({ left: index * step, behavior: 'smooth' })
  }

  if (!products || products.length === 0) {
    return null
  }

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
        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
            <div
              ref={trackRef}
              className="flex gap-4 px-4 py-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none"
            >
              {products.map((product, index) => {
                const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
                const displayPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)
                const ugxPrice = Math.round(displayPrice * 3800)

                return (
                  <div
                    key={product.id}
                    className="snap-start min-w-[calc((100%-4rem)/5)] sm:min-w-[280px] rounded-3xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="relative overflow-hidden rounded-t-3xl bg-gray-100 h-72">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {hasDiscount && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          SALE
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-[#1e3a5f] text-white text-[10px] font-semibold px-2 py-1 rounded">
                        {product.type === 'digital' ? 'DIGITAL' : 'PHYSICAL'}
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-primary line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                          {product.short_description}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-primary">
                            UGX {ugxPrice.toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through">
                              UGX {Math.round(product.regular_price_usd * 3800).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <p className="text-xs text-green-600 font-semibold">
                            Save {Math.round((1 - product.sale_price_usd / product.regular_price_usd) * 100)}%
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" className="flex-1 bg-[#d4a017] hover:bg-[#b88a12] text-white">
                          <Link href={`/shop/${product.slug}`}>
                            View
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href="/shop">
                            Shop
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {products.length > visibleCount && (
            <>
              <button
                onClick={goToPrevious}
                disabled={currentIndex <= 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 border border-gray-200 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous product"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex >= maxIndex}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 border border-gray-200 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next product"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}

          {products.length > visibleCount && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex ? 'bg-[#d4a017] scale-125' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
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