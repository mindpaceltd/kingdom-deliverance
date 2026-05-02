'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShopFiltersProps {
  categories: any[]
}

export function ShopFilters({ categories }: ShopFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')
  const searchQuery = searchParams.get('search') || ''

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <div className="space-y-10">
      {/* Search */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          <Search className="w-3 h-3 text-accent" /> Search Products
        </h4>
        <div className="relative">
          <Input
            placeholder="Find a book or item..."
            className="pl-10 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-accent/30"
            defaultValue={searchQuery}
            onChange={(e) => {
              const val = e.target.value
              const timeout = setTimeout(() => updateFilters('search', val), 500)
              return () => clearTimeout(timeout)
            }}
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Filter className="w-3 h-3 text-accent" /> Categories
          </h4>
          {activeCategory && (
            <button 
              onClick={() => updateFilters('category', null)}
              className="text-[10px] text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilters('category', cat.slug)}
              className={cn(
                "group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                activeCategory === cat.slug
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-primary/70 hover:bg-muted/50 hover:text-primary"
              )}
            >
              <span>{cat.name}</span>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                activeCategory === cat.slug ? "bg-accent scale-125" : "bg-muted-foreground/20 group-hover:bg-accent"
              )} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
