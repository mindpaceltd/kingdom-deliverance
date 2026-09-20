'use client'

import React, { startTransition, useDeferredValue } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  SlidersHorizontal,
  X,
  BookOpen,
  Package,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ShopCategoryOption {
  id: string
  name: string
  slug: string
  count: number
}

interface ShopFiltersProps {
  categories: ShopCategoryOption[]
  totalCount?: number
  digitalCount?: number
  physicalCount?: number
  mode?: 'desktop' | 'mobile'
}

function decodeLabel(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

export function ShopFilters({
  categories,
  totalCount = 0,
  digitalCount = 0,
  physicalCount = 0,
  mode = 'desktop',
}: ShopFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')
  const activeType = searchParams.get('type')
  const searchQuery = searchParams.get('search') || ''
  const [search, setSearch] = React.useState(searchQuery)
  const deferredSearch = useDeferredValue(search)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    setSearch(searchQuery)
  }, [searchQuery])

  const updateFilters = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('page')
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      const qs = params.toString()
      startTransition(() => {
        router.push(qs ? `/shop?${qs}` : '/shop')
      })
    },
    [searchParams, router]
  )

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      const next = deferredSearch.trim()
      if (next === searchQuery) return
      updateFilters({ search: next || null })
    }, 350)
    return () => clearTimeout(timeout)
  }, [deferredSearch, searchQuery, updateFilters])

  const visibleCategories = categories.filter((c) => c.count > 0)
  const activeCategoryName = visibleCategories.find((c) => c.slug === activeCategory)?.name
  const hasActiveFilters = Boolean(activeCategory || activeType || searchQuery)
  const activeFilterCount = [activeCategory, activeType, searchQuery].filter(Boolean).length
  const isMobile = mode === 'mobile'
  const showBody = !isMobile || mobileOpen

  const formatOptions = [
    { key: null as string | null, label: 'All', count: totalCount, icon: LayoutGrid, hint: 'Full catalog' },
    { key: 'digital', label: 'Digital', count: digitalCount, icon: BookOpen, hint: 'Instant download' },
    { key: 'physical', label: 'Physical', count: physicalCount, icon: Package, hint: 'Shipped items' },
  ]

  return (
    <div className="space-y-3">
      {isMobile && (
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          className="group flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-gradient-to-r from-[#0d1b2a] to-[#1e3a5f] px-4 py-3.5 text-left text-white shadow-md transition hover:brightness-110"
        >
          <span className="inline-flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#d4a017]/20 text-[#d4a017]">
              <SlidersHorizontal className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold tracking-tight">Filters &amp; search</span>
              <span className="block truncate text-[11px] text-white/60">
                {hasActiveFilters
                  ? `${activeFilterCount} active · tap to ${mobileOpen ? 'hide' : 'edit'}`
                  : 'Search, format, categories'}
              </span>
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2">
            {hasActiveFilters ? (
              <span className="rounded-md bg-[#d4a017] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#0d1b2a]">
                {activeFilterCount}
              </span>
            ) : null}
            <ChevronDown
              className={cn(
                'size-4 text-white/70 transition-transform duration-300',
                mobileOpen && 'rotate-180'
              )}
            />
          </span>
        </button>
      )}

      {showBody && (
        <div
          className={cn(
            'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_-24px_rgba(13,27,42,0.45)]',
            'lg:sticky lg:top-24',
            isMobile && 'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
        >
          <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#0d1b2a] via-[#1e3a5f] to-[#243b55] px-4 py-4">
            <div
              className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-[#d4a017]/15 blur-2xl"
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4a017]">
                  Ministry store
                </p>
                <h3 className="mt-1 text-base font-bold tracking-tight text-white">Find resources</h3>
                <p className="mt-0.5 text-[11px] text-white/55">
                  {totalCount.toLocaleString()} products ready to browse
                </p>
              </div>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    updateFilters({ category: null, type: null, search: null })
                  }}
                  className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/20"
                >
                  Clear all
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-5 p-4">
            {hasActiveFilters ? (
              <div className="flex flex-wrap gap-1.5">
                {searchQuery ? (
                  <FilterChip
                    label={`“${searchQuery}”`}
                    onRemove={() => {
                      setSearch('')
                      updateFilters({ search: null })
                    }}
                  />
                ) : null}
                {activeType ? (
                  <FilterChip
                    label={activeType === 'digital' ? 'Digital' : 'Physical'}
                    onRemove={() => updateFilters({ type: null })}
                  />
                ) : null}
                {activeCategory && activeCategoryName ? (
                  <FilterChip
                    label={decodeLabel(activeCategoryName)}
                    onRemove={() => updateFilters({ category: null })}
                  />
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor={`shop-search-${mode}`}
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400"
              >
                Search
              </label>
              <div className="relative">
                <input
                  id={`shop-search-${mode}`}
                  type="search"
                  placeholder="Books, oils, teachings…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#d4a017] focus:bg-white focus:ring-4 focus:ring-[#d4a017]/15"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                {search ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearch('')
                      updateFilters({ search: null })
                    }}
                    className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Format
              </p>
              <div className="grid grid-cols-3 gap-2">
                {formatOptions.map((item) => {
                  const selected = (item.key ?? null) === (activeType || null)
                  const Icon = item.icon
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => updateFilters({ type: item.key })}
                      className={cn(
                        'group relative flex flex-col items-start gap-2 rounded-xl border px-2.5 py-3 text-left transition duration-200',
                        selected
                          ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-md shadow-[#1e3a5f]/20'
                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-[#d4a017]/50 hover:bg-white hover:shadow-sm'
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-7 items-center justify-center rounded-lg transition',
                          selected
                            ? 'bg-[#d4a017]/20 text-[#d4a017]'
                            : 'bg-white text-[#1e3a5f] group-hover:text-[#d4a017]'
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span>
                        <span className="block text-[12px] font-bold leading-none">{item.label}</span>
                        <span
                          className={cn(
                            'mt-1 block text-[10px] tabular-nums leading-none',
                            selected ? 'text-white/65' : 'text-slate-400'
                          )}
                        >
                          {item.count.toLocaleString()}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Categories
                </p>
                <span className="text-[10px] tabular-nums text-slate-400">
                  {visibleCategories.length}
                </span>
              </div>
              <div
                className={cn(
                  'flex flex-col gap-0.5 rounded-xl bg-slate-50/70 p-1',
                  isMobile ? 'max-h-56 overflow-y-auto' : 'max-h-[26rem] overflow-y-auto'
                )}
              >
                <CategoryRow
                  label="All products"
                  count={totalCount}
                  selected={!activeCategory}
                  onClick={() => updateFilters({ category: null })}
                  accent="navy"
                />
                {visibleCategories.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    label={decodeLabel(cat.name)}
                    count={cat.count}
                    selected={activeCategory === cat.slug}
                    onClick={() => updateFilters({ category: cat.slug })}
                    accent="gold"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#d4a017]/35 bg-[#d4a017]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1e3a5f] transition hover:bg-[#d4a017]/20"
    >
      <span className="truncate">{label}</span>
      <X className="size-3 shrink-0 opacity-70" />
    </button>
  )
}

function CategoryRow({
  label,
  count,
  selected,
  onClick,
  accent,
}: {
  label: string
  count: number
  selected: boolean
  onClick: () => void
  accent: 'navy' | 'gold'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition duration-150',
        selected
          ? accent === 'navy'
            ? 'bg-[#1e3a5f] font-semibold text-white shadow-sm'
            : 'bg-white font-semibold text-[#1e3a5f] shadow-sm ring-1 ring-[#d4a017]/40'
          : 'text-slate-600 hover:bg-white hover:text-slate-900'
      )}
    >
      {selected && accent === 'gold' ? (
        <span
          className="absolute inset-y-2 left-1 w-0.5 rounded-full bg-[#d4a017]"
          aria-hidden
        />
      ) : null}
      <span className="min-w-0 truncate pl-1 text-left">{label}</span>
      <span
        className={cn(
          'shrink-0 rounded-md px-1.5 py-0.5 text-[11px] tabular-nums',
          selected
            ? accent === 'navy'
              ? 'bg-white/15 text-white'
              : 'bg-[#d4a017]/20 text-[#7a5a00]'
            : 'bg-white text-slate-400 ring-1 ring-slate-200/80'
        )}
      >
        {count.toLocaleString()}
      </span>
    </button>
  )
}
