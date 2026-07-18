'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Globe, Copy, Trash2, Loader2, X, Pencil } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductBulkActions, DuplicateProductButton } from '@/components/admin/products/product-bulk-actions'
import { deleteProduct, deleteProducts, duplicateProducts } from '@/lib/actions/products'
import { buildPublicContentUrl } from '@/lib/seo/public-content-urls'
import { cn } from '@/lib/utils'
import { getSeoScoreColor } from '@/lib/posts-helpers'
import { computeProductSeoScore } from '@/lib/products/product-seo-score'
import { normalizeMediaUrl } from '@/lib/media-url'

export interface ProductRow {
  id: string
  name: string
  slug?: string
  type?: string
  status?: string
  image_url?: string
  image_alt?: string | null
  short_description?: string | null
  description?: string | null
  meta_title?: string | null
  meta_description?: string | null
  seo_score?: number | null
  views?: number | null
  category?: { name: string }
  price_usd: number
  sale_price_usd: number
  regular_price_usd: number
}

function SeoScoreBadge({ score }: { score: number }) {
  const color = getSeoScoreColor(score ?? 0)
  const colorClass = {
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    green: 'text-green-600 bg-green-50',
  }[color]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
        colorClass
      )}
    >
      {score}%
    </span>
  )
}

function resolveProductSeoScore(product: ProductRow): number {
  return computeProductSeoScore({
    meta_title: product.meta_title,
    meta_description: product.meta_description,
    image_alt: product.image_alt,
    description: product.description,
    short_description: product.short_description,
  })
}

function resolveDisplayPrice(product: ProductRow): { current: number; original?: number } {
  const regular = Number(product.regular_price_usd || 0)
  const sale = Number(product.sale_price_usd || 0)
  const fallback = Number(product.price_usd || 0)
  if (sale > 0 && regular > 0 && sale < regular) {
    return { current: sale, original: regular }
  }
  if (regular > 0) return { current: regular }
  return { current: fallback }
}

interface ProductsManagerProps {
  initialProducts: ProductRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  activeFilters?: {
    status?: string
    type?: string
    category?: string
    q?: string
  }
  displayCurrency?: string
  exchangeRates?: Record<string, number>
}

export function ProductsManager({
  initialProducts,
  total,
  page,
  pageSize,
  totalPages,
  activeFilters,
  displayCurrency = 'USD',
  exchangeRates = { USD: 1 },
}: ProductsManagerProps) {
  const router = useRouter()
  const [products, setProducts] = React.useState<ProductRow[]>(initialProducts)

  React.useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const targetCurrency = String(displayCurrency || 'USD').toUpperCase()
  const targetRate = Number(exchangeRates[targetCurrency] ?? 1) || 1

  function formatAdminPrice(usdPrice: number) {
    const converted = usdPrice * targetRate
    const locale = targetCurrency === 'UGX' ? 'en-UG' : 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
      maximumFractionDigits: targetCurrency === 'UGX' ? 0 : 2,
    }).format(converted || 0)
  }

  const allSelected =
    products.length > 0 && products.every((product) => selectedIds.has(product.id))
  const someSelected =
    products.some((product) => selectedIds.has(product.id)) && !allSelected

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
      return
    }

    setSelectedIds(new Set(products.map((product) => product.id)))
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const currentPage = page + 1
  const pageStart = total === 0 ? 0 : page * pageSize + 1
  const pageEnd = Math.min((page + 1) * pageSize, total)

  function goToPage(nextPage: number) {
    const clamped = Math.max(1, Math.min(nextPage, totalPages))
    setSelectedIds(new Set())
    const params = new URLSearchParams()
    if (activeFilters?.status && activeFilters.status !== 'all') {
      params.set('status', activeFilters.status)
    }
    if (activeFilters?.type && activeFilters.type !== 'all') {
      params.set('type', activeFilters.type)
    }
    if (activeFilters?.category && activeFilters.category !== 'all') {
      params.set('category', activeFilters.category)
    }
    if (activeFilters?.q?.trim()) {
      params.set('q', activeFilters.q.trim())
    }
    if (clamped > 1) {
      params.set('page', String(clamped))
    }
    const query = params.toString()
    router.push(query ? `/admin/products?${query}` : '/admin/products')
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setActionLoading(`delete-${id}`)
    await deleteProduct(id)
    setActionLoading(null)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (products.length === 1 && currentPage > 1) {
      goToPage(currentPage - 1)
    } else {
      router.refresh()
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Delete ${selectedIds.size} selected product(s)? This cannot be undone.`)) return
    setActionLoading('bulk-delete')
    await deleteProducts(Array.from(selectedIds))
    setActionLoading(null)
    setSelectedIds(new Set())
    router.refresh()
  }

  async function handleBulkDuplicate() {
    if (selectedIds.size === 0) return
    if (
      !window.confirm(
        `Duplicate ${selectedIds.size} selected product(s)? Copies will be saved as drafts.`
      )
    ) {
      return
    }
    setActionLoading('bulk-duplicate')
    const result = await duplicateProducts(Array.from(selectedIds))
    setActionLoading(null)
    if ('error' in result) {
      alert(result.error)
    } else {
      const failedNote =
        result.failed?.length
          ? `\n\n${result.failed.length} could not be duplicated (see server logs).`
          : ''
      alert(`Duplicated ${result.count} product(s) as drafts.${failedNote}`)
    }
    setSelectedIds(new Set())
    router.refresh()
  }

  async function handleBulkIndex() {
    const urls = products
      .filter(
        (p) =>
          selectedIds.has(p.id) &&
          p.status === 'published' &&
          p.slug
      )
      .map((p) => buildPublicContentUrl('product', p.slug!))

    if (urls.length === 0) {
      alert('Select published products to submit to Google.')
      return
    }

    setActionLoading('bulk-index')
    try {
      const { submitGoogleIndexing } = await import('@/lib/seo/submit-google-indexing-client')
      const result = await submitGoogleIndexing(urls)
      if (!result.ok) {
        alert(result.message + (result.hint ? `\n\n${result.hint}` : ''))
      } else {
        alert(result.message)
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Request failed'}`)
    }
    setActionLoading(null)
  }

  async function handleSingleIndex(product: ProductRow) {
    if (product.status !== 'published' || !product.slug) {
      alert('Only published products can be indexed.')
      return
    }
    setActionLoading(`index-${product.id}`)
    try {
      const { submitGoogleIndexing } = await import('@/lib/seo/submit-google-indexing-client')
      const result = await submitGoogleIndexing([
        buildPublicContentUrl('product', product.slug),
      ])
      if (!result.ok) {
        alert(result.message + (result.hint ? `\n\n${result.hint}` : ''))
      } else {
        alert(result.message)
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Request failed'}`)
    }
    setActionLoading(null)
  }

  const bulkBusy = Boolean(actionLoading?.startsWith('bulk-'))

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="border-b bg-muted/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Products</h2>
            <p className="text-sm text-muted-foreground">
              Select products to duplicate, delete, or submit to Google in bulk.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={Boolean(actionLoading)}
              onClick={async () => {
                const urls = products
                  .filter((p) => p.status === 'published' && p.slug)
                  .map((p) => buildPublicContentUrl('product', p.slug!))
                if (urls.length === 0) {
                  alert('No published products on this page to submit.')
                  return
                }
                setActionLoading('bulk-index-page')
                try {
                  const { submitGoogleIndexing } = await import('@/lib/seo/submit-google-indexing-client')
                  const result = await submitGoogleIndexing(urls)
                  if (!result.ok) {
                    alert(result.message + (result.hint ? `\n\n${result.hint}` : ''))
                  } else {
                    alert(result.message)
                  }
                } catch (err) {
                  alert(`Error: ${err instanceof Error ? err.message : 'Request failed'}`)
                }
                setActionLoading(null)
              }}
            >
              {actionLoading === 'bulk-index-page' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              Bulk Google Index (This Page)
            </Button>
            <ProductBulkActions />
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-3">
          <span className="mr-2 text-sm font-medium text-primary">
            {selectedIds.size} selected
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            disabled={bulkBusy}
            onClick={handleBulkDuplicate}
          >
            {actionLoading === 'bulk-duplicate' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Duplicate selected
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={bulkBusy}
            onClick={handleBulkIndex}
          >
            {actionLoading === 'bulk-index' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            Index in Google
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={bulkBusy}
            onClick={handleBulkDelete}
          >
            {actionLoading === 'bulk-delete' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete selected
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      )}

      {/* Mobile card list */}
      <div className="md:hidden divide-y">
        {products.length > 0 ? (
          products.map((product) => {
            const isSelected = selectedIds.has(product.id)
            const price = resolveDisplayPrice(product)
            const discountPct =
              price.original && price.original > price.current
                ? Math.round(((price.original - price.current) / price.original) * 100)
                : null
            return (
              <div
                key={product.id}
                className={cn(
                  'p-4 space-y-3',
                  isSelected && 'bg-primary/5'
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSelectRow(product.id)}
                    aria-label={`Select ${product.name}`}
                    className="mt-1"
                  />
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
                    {product.image_url ? (
                      <img
                        src={normalizeMediaUrl(product.image_url) || '/placeholder.png'}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget
                          if (!target.src.endsWith('/placeholder.png')) target.src = '/placeholder.png'
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">No img</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-primary leading-snug line-clamp-2">{product.name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        {product.status || 'published'}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {product.type || 'product'}
                      </span>
                      {discountPct != null && (
                        <span className="text-[10px] font-bold text-red-500">-{discountPct}%</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {product.category?.name || 'Uncategorized'}
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-mono font-bold text-primary text-sm">
                        {formatAdminPrice(price.current)}
                      </span>
                      {price.original && (
                        <span className="text-[10px] text-red-500 line-through opacity-60">
                          {formatAdminPrice(price.original)}
                        </span>
                      )}
                      <SeoScoreBadge score={resolveProductSeoScore(product)} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-7">
                  {product.status === 'published' && product.slug && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      disabled={Boolean(actionLoading)}
                      onClick={() => handleSingleIndex(product)}
                    >
                      <Globe className="h-3.5 w-3.5" /> Index
                    </Button>
                  )}
                  <DuplicateProductButton productId={product.id} />
                  <Button variant="outline" size="sm" asChild className="h-8 gap-1.5">
                    <Link href={`/admin/products/${product.id}`}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id, product.name)}
                    disabled={actionLoading === `delete-${product.id}` || actionLoading === 'bulk-delete'}
                    className="h-8 gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="px-4 py-12 text-center text-muted-foreground italic text-sm">
            No products found in your inventory.
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 w-[52px]">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all products"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">SEO</th>
              <th className="px-4 py-3 font-semibold">{`Price (${targetCurrency})`}</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length > 0 ? (
              products.map((product) => {
                const isSelected = selectedIds.has(product.id)
                const price = resolveDisplayPrice(product)
                return (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4 align-top">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectRow(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
                          {product.image_url ? (
                            <img
                              src={normalizeMediaUrl(product.image_url) || '/placeholder.png'}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget
                                if (!target.src.endsWith('/placeholder.png')) target.src = '/placeholder.png'
                              }}
                            />
                          ) : (
                            <span className="text-muted-foreground text-[10px]">No image</span>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span
                            className="font-bold text-primary line-clamp-2 leading-tight"
                            title={product.name}
                          >
                            {product.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            {product.type || 'product'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                        {product.status || 'published'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground font-medium">
                      <span className="block truncate max-w-[150px]" title={product.category?.name || 'Uncategorized'}>
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <SeoScoreBadge score={resolveProductSeoScore(product)} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-primary">{formatAdminPrice(price.current)}</span>
                        {price.original && (
                          <span className="text-[10px] text-red-500 line-through opacity-60">
                            {formatAdminPrice(price.original)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {product.status === 'published' && product.slug && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            title="Submit to Google Indexing"
                            disabled={Boolean(actionLoading)}
                            onClick={() => handleSingleIndex(product)}
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                        )}
                        <DuplicateProductButton productId={product.id} />
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                          title="Edit product"
                        >
                          <Link href={`/admin/products/${product.id}`} aria-label="Edit product">
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={actionLoading === `delete-${product.id}` || actionLoading === 'bulk-delete'}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          title="Delete product"
                          aria-label="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic">
                  No products found in your inventory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {pageStart}–{pageEnd} of {total}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="px-2 text-xs font-medium text-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
