'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductBulkActions, DuplicateProductButton } from '@/components/admin/products/product-bulk-actions'
import { deleteProduct, deleteProducts } from '@/lib/actions/products'
import { formatPrice } from '@/lib/utils'

export interface ProductRow {
  id: string
  name: string
  type?: string
  status?: string
  image_url?: string
  category?: { name: string }
  price_usd: number
  sale_price_usd: number
  regular_price_usd: number
}

interface ProductsManagerProps {
  initialProducts: ProductRow[]
}

export function ProductsManager({ initialProducts }: ProductsManagerProps) {
  const router = useRouter()
  const [products, setProducts] = React.useState<ProductRow[]>(initialProducts)
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
    router.refresh()
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

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="border-b bg-muted/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Products</h2>
            <p className="text-sm text-muted-foreground">Select products to delete individually or in bulk.</p>
          </div>
          <ProductBulkActions
            selectedCount={selectedIds.size}
            onBulkDelete={handleBulkDelete}
            onClearSelection={() => setSelectedIds(new Set())}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 w-[52px]"><Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleSelectAll} aria-label="Select all products" /></th>
              <th className="px-6 py-4 font-semibold">Product</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Price (USD)</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length > 0 ? (
              products.map((product) => {
                const isSelected = selectedIds.has(product.id)
                return (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 align-top"><Checkbox checked={isSelected} onChange={() => toggleSelectRow(product.id)} aria-label={`Select ${product.name}`} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-muted-foreground">No image</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{product.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{product.type || 'product'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                        {product.status || 'published'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">
                      {product.category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-primary">{formatPrice(product.price_usd)}</span>
                        {product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd && (
                          <span className="text-[10px] text-red-500 line-through opacity-60">
                            {formatPrice(product.regular_price_usd)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DuplicateProductButton productId={product.id} />
                        <Button variant="outline" size="sm" asChild className="h-8">
                          <Link href={`/admin/products/${product.id}`}>Edit</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={actionLoading === `delete-${product.id}` || actionLoading === 'bulk-delete'}
                          className="text-destructive hover:text-destructive"
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
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                  No products found in your inventory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
