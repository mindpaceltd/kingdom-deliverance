import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PlusIcon, PackageIcon, FileIcon } from 'lucide-react'
import Link from 'next/link'
import { ProductsManager } from '@/components/admin/products/products-manager'

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

      <ProductsManager initialProducts={products || []} />
    </div>
  )
}
