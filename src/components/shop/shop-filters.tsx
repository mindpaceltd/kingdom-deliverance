'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MessageCircle } from 'lucide-react'

interface ShopFiltersProps {
  categories: any[]
  productCounts?: Record<string, number>
  totalCount?: number
}

export function ShopFilters({ categories, productCounts = {}, totalCount = 0 }: ShopFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')
  const searchQuery = searchParams.get('search') || ''
  const [search, setSearch] = React.useState(searchQuery)

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/shop?${params.toString()}`)
  }

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      updateFilters('search', search || null)
    }, 500)
    return () => clearTimeout(timeout)
  }, [search])

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2 shadow-sm">
        <h4 className="text-sm font-bold text-gray-800">Search Products</h4>
        <div className="relative">
          <input
            type="text"
            placeholder="Find a book or item..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-[#d4a017] focus:ring-1 focus:ring-[#d4a017]/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2 shadow-sm">
        <h4 className="text-sm font-bold text-gray-800">Categories</h4>
        <div className="flex flex-col gap-0.5">
          {/* All Products */}
          <button
            onClick={() => updateFilters('category', null)}
            className={`flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
              !activeCategory
                ? 'bg-gray-100 text-gray-900 font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span>All Products</span>
            <span className="text-xs text-gray-400">{totalCount}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilters('category', cat.slug)}
              className={`flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                activeCategory === cat.slug
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-xs text-gray-400">{productCounts[cat.id] || ''}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Need Help Box */}
      <div className="bg-[#f8f4eb] rounded-2xl p-5 space-y-3 border border-[#e8d9b5] shadow-sm">
        <h4 className="font-bold text-sm text-gray-800">Need Help Choosing?</h4>
        <p className="text-xs text-gray-500 leading-relaxed">We're here to help you find the right resource.</p>
        <a
          href="/contact"
          className="flex items-center justify-center gap-2 w-full bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-xs font-bold uppercase tracking-wide py-2.5 rounded-lg transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Contact Us
        </a>
      </div>
    </div>
  )
}
