import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlusIcon, PackageIcon, FileIcon } from 'lucide-react'
import Link from 'next/link'
import {
  ProductsManager,
  type ProductRow,
} from '@/components/admin/products/products-manager'
import { getProductsAdminPage, getProductsAdminStats } from '@/lib/actions/products'

type PageProps = {
  searchParams?: { page?: string }
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const pageParam = Math.max(1, parseInt(searchParams?.page ?? '1', 10) || 1)
  const pageIndex = pageParam - 1

  const [statsResult, listResult] = await Promise.all([
    getProductsAdminStats(),
    getProductsAdminPage({ page: pageIndex }),
  ])

  const stats =
    'error' in statsResult ? { total: 0, published: 0, drafts: 0 } : statsResult

  if ('error' in listResult) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Shop Inventory</h1>
        <p className="text-sm text-destructive">Could not load products: {listResult.error}</p>
      </div>
    )
  }

  if (listResult.total > 0 && pageParam > listResult.totalPages) {
    redirect(`/admin/products?page=${listResult.totalPages}`)
  }

  const safePage = Math.min(pageIndex, Math.max(0, listResult.totalPages - 1))

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Manage your products, digital content, and merchandise.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/admin/products/new">
              <PlusIcon className="mr-2 h-4 w-4" /> Add New Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <PackageIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Active</p>
              <h2 className="text-2xl font-bold">{stats.published}</h2>
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
              <h2 className="text-2xl font-bold text-yellow-600">{stats.drafts}</h2>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm sm:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">All products</p>
              <h2 className="text-2xl font-bold">{stats.total}</h2>
            </div>
          </div>
        </div>
      </div>

      <ProductsManager
        initialProducts={listResult.data as ProductRow[]}
        total={listResult.total}
        page={safePage}
        pageSize={listResult.pageSize}
        totalPages={listResult.totalPages}
      />
    </div>
  )
}
