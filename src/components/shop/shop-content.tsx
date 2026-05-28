'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List, ShoppingBag } from 'lucide-react'
import { ProductCard } from './product-card'
import { SortSelect } from './sort-select'
import { cn } from '@/lib/utils'

interface ShopContentProps {
  products: any[]
  currentPage: number
  totalCount: number
  pageSize: number
}

export function ShopContent({ products, currentPage, totalCount, pageSize }: ShopContentProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showingTo = Math.min(currentPage * pageSize, totalCount)

  const goToPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(totalPages, page))
    const params = new URLSearchParams(searchParams.toString())
    if (nextPage === 1) params.delete('page')
    else params.set('page', String(nextPage))
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <div className="flex-1">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between mb-6 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500 hidden sm:block">
            Showing{' '}
            <span className="font-bold text-primary">
              {showingFrom}-{showingTo}
            </span>{' '}
            of <span className="font-bold text-primary">{totalCount}</span> products
          </p>
          <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-100">
            <button
              onClick={() => setView('grid')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                view === 'grid' ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                view === 'list' ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        <SortSelect />
      </div>

      {products.length > 0 ? (
        <div className="space-y-6">
          <div className={cn(
            "grid",
            view === 'grid' 
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6" 
              : "grid-cols-1 gap-4"
          )}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} view={view} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, index) => {
                const page = index + 1
                return (
                  <button
                    type="button"
                    key={page}
                    onClick={() => goToPage(page)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm',
                      page === currentPage
                        ? 'border-[#d4a017] bg-[#d4a017]/15 text-primary font-semibold'
                        : 'border-gray-200'
                    )}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl border-2 border-dashed border-gray-100 bg-white shadow-sm">
          <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-primary/70 mb-1">No products found</h3>
          <p className="text-sm text-gray-400">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  )
}
