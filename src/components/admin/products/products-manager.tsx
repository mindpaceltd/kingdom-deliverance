'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Globe, Copy, Trash2, Loader2, X, Eye } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductBulkActions, DuplicateProductButton } from '@/components/admin/products/product-bulk-actions'
import { deleteProduct, deleteProducts, duplicateProducts } from '@/lib/actions/products'
import { buildPublicContentUrl } from '@/lib/seo/public-content-urls'
import { formatPrice, cn } from '@/lib/utils'
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
}

export function ProductsManager({
  initialProducts,
  total,
  page,
  pageSize,
  totalPages,
  activeFilters,
}: ProductsManagerProps) {
  const router = useRouter()
  const [products, setProducts] = React.useState<ProductRow[]>(initialProducts)

  React.useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Products</h2>
            <p className="text-sm text-muted-foreground">
              Select products to duplicate, delete, or submit to Google in bulk.
            </p>
          </div>
          <ProductBulkActions />
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

      <div className="overflow-hidden">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 w-[52px]"><Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleSelectAll} aria-label="Select all products" /></th>
              <th className="px-6 py-4 font-semibold">Product</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold hidden lg:table-cell">SEO</th>
              <th className="px-6 py-4 font-semibold hidden xl:table-cell">Views</th>
              <th className="px-6 py-4 font-semibold">Price (USD)</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length > 0 ? (
              products.map((product) => {
                const isSelected = selectedIds.has(product.id)
                const price = resolveDisplayPrice(product)
                return (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 align-top"><Checkbox checked={isSelected} onChange={() => toggleSelectRow(product.id)} aria-label={`Select ${product.name}`} /></td>
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
                            <span className="text-muted-foreground">No image</span>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="font-bold text-primary truncate max-w-[160px] md:max-w-[240px]" title={product.name}>
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
                      <span className="block truncate max-w-[90px] md:max-w-[150px]" title={product.category?.name || 'Uncategorized'}>
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <SeoScoreBadge score={resolveProductSeoScore(product)} />
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-muted-foreground">
                        <Eye className="size-3.5 shrink-0 opacity-60" />
                        {(product.views ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-primary">{formatPrice(price.current)}</span>
                        {price.original && (
                          <span className="text-[10px] text-red-500 line-through opacity-60">
                            {formatPrice(price.original)}
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
                        <Button variant="outline" size="sm" asChild className="h-8 px-2">
                          <Link href={`/admin/products/${product.id}`}>Edit</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={actionLoading === `delete-${product.id}` || actionLoading === 'bulk-delete'}
                          className="text-destructive hover:text-destructive px-2"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground italic">
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
