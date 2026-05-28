'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { normalizeMediaUrl } from '@/lib/media-url'

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
  badge?: string
  title?: string
  subtitle?: string
  viewAllLabel?: string
  viewAllUrl?: string
}

function ProductThumb({ src, alt, priority = false }: { src?: string; alt: string; priority?: boolean }) {
  const [imageSrc, setImageSrc] = useState(normalizeMediaUrl(src) || '/placeholder.png')
  useEffect(() => {
    setImageSrc(normalizeMediaUrl(src) || '/placeholder.png')
  }, [src])

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className="w-full h-full object-cover object-top"
      onError={() => setImageSrc('/placeholder.png')}
    />
  )
}

export function ProductCarousel({
  products,
  badge = 'KDC Store',
  title = 'Featured Products',
  subtitle = 'Discover resources to enrich your spiritual journey',
  viewAllLabel = 'View All Products',
  viewAllUrl = '/shop',
}: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const visibleCount = 5

  const maxIndex = Math.max(products.length - visibleCount, 0)

  useEffect(() => {
    setCurrentIndex(0)
    if (trackRef.current) {
      trackRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [products])

  // Auto-scroll logic
  useEffect(() => {
    if (isPaused || products.length <= visibleCount) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev >= maxIndex ? 0 : prev + 1
        if (trackRef.current) {
          const step = (trackRef.current.scrollWidth - trackRef.current.clientWidth) / maxIndex
          trackRef.current.scrollTo({ left: nextIndex * step, behavior: 'smooth' })
        }
        return nextIndex
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [isPaused, maxIndex, products.length, visibleCount])

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      const nextIndex = Math.max(prev - 1, 0)
      if (trackRef.current) {
        const step = (trackRef.current.scrollWidth - trackRef.current.clientWidth) / maxIndex
        trackRef.current.scrollTo({ left: nextIndex * step, behavior: 'smooth' })
      }
      return nextIndex
    })
  }

  const goToNext = () => {
    setCurrentIndex((prev) => {
      const nextIndex = Math.min(prev + 1, maxIndex)
      if (trackRef.current) {
        const step = (trackRef.current.scrollWidth - trackRef.current.clientWidth) / maxIndex
        trackRef.current.scrollTo({ left: nextIndex * step, behavior: 'smooth' })
      }
      return nextIndex
    })
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    if (!trackRef.current) return
    const step = (trackRef.current.scrollWidth - trackRef.current.clientWidth) / maxIndex
    trackRef.current.scrollTo({ left: index * step, behavior: 'smooth' })
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-gradient-to-br from-gray-50 to-white">
      <div className="container px-4">
        {/* Header */}
        <div className="mb-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            <ShoppingCart className="h-3 w-3" />
            {badge}
          </div>
          <h2 className="text-3xl font-bold md:text-4xl font-serif text-primary">{title}</h2>
          <p className="text-sm text-primary/60 max-w-xl mx-auto">{subtitle}</p>
        </div>

        {/* Carousel */}
        <div 
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
            <div
              ref={trackRef}
              className="flex gap-4 px-4 py-8 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none"
            >
              {products.map((product, index) => {
                const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
                const displayPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)
                const ugxPrice = Math.round(displayPrice * 3800)

                return (
                  <div
                    key={product.id}
                    className="snap-start min-w-[calc((100%-1rem)/2)] sm:min-w-[calc((100%-1rem)/2)] md:min-w-[calc((100%-3rem)/4)] lg:min-w-[calc((100%-4rem)/5)] rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-2xl bg-gray-50">
                      <ProductThumb src={product.image_url} alt={product.name} priority={index < 3} />
                      {hasDiscount && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          SALE
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
                        {product.type === 'digital' ? 'DIGITAL' : 'PHYSICAL'}
                      </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-0.5">
                        <h3 className="text-[13px] font-bold text-primary line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                          {product.short_description}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-primary">
                            UGX {ugxPrice.toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-gray-400 line-through">
                              {Math.round(product.regular_price_usd * 3800).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <p className="text-[10px] text-green-600 font-bold">
                            Save {Math.round((1 - product.sale_price_usd / product.regular_price_usd) * 100)}%
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        <Button asChild size="sm" className="h-8 flex-1 bg-accent hover:bg-accent/90 text-primary text-[10px] font-bold px-0">
                          <Link href={`/shop/${product.slug}`}>
                            View
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="h-8 flex-1 border-primary/20 text-primary text-[10px] font-bold px-0 hover:bg-primary/5">
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
        <div className="text-center mt-8">
          <Button asChild size="sm" className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-6">
            <Link href={viewAllUrl}>
              {viewAllLabel}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}