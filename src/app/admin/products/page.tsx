import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PlusIcon, PackageIcon, FileIcon, TagIcon } from 'lucide-react'
import Link from 'next/link'
import { formatPrice, cn } from '@/lib/utils'
import { ProductBulkActions, DuplicateProductButton } from '@/components/admin/products/product-bulk-actions'

export default async function AdminProductsPage() {
  const supabase = createClient()
  
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      category:product_categories(name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage your products, digital content, and merchandise.</p>
        </div>
        <div className="flex items-center gap-3">
          <ProductBulkActions />
          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/admin/products/new">
              <PlusIcon className="mr-2 h-4 w-4" /> Add New Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <PackageIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Active</p>
              <h2 className="text-2xl font-bold">{products?.filter(p => p.status === 'published').length || 0}</h2>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-600">
              <FileIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Drafts</p>
              <h2 className="text-2xl font-bold text-yellow-600">{products?.filter(p => p.status === 'draft').length || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price (USD)</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products && products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <PackageIcon className="h-6 w-6 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{product.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{product.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter border",
                        product.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 
                        product.status === 'draft' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                        'bg-slate-50 text-slate-700 border-slate-200'
                      )}>
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    No products found in your inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
