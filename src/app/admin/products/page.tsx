import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlusIcon, PackageIcon, FileIcon } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCreditSettings } from '@/lib/credits/settings'
import { getExchangeRates } from '@/lib/services/exchange-rates'
import {
  ProductsManager,
  type ProductRow,
} from '@/components/admin/products/products-manager'
import { getProductsAdminPage, getProductsAdminStats } from '@/lib/actions/products'

type PageProps = {
  searchParams?: {
    page?: string
    status?: string
    type?: string
    category?: string
    q?: string
  }
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const statusFilter = searchParams?.status?.trim() || 'all'
  const typeFilter = searchParams?.type?.trim() || 'all'
  const categoryFilter = searchParams?.category?.trim() || 'all'
  const queryFilter = searchParams?.q?.trim() || ''
  const pageParam = Math.max(1, parseInt(searchParams?.page ?? '1', 10) || 1)
  const pageIndex = pageParam - 1
  const supabase = createClient()

  const [statsResult, listResult, categoriesResult, creditSettings, exchangeRates] = await Promise.all([
    getProductsAdminStats(),
    getProductsAdminPage({
      page: pageIndex,
      status: statusFilter,
      type: typeFilter,
      categoryId: categoryFilter,
      query: queryFilter,
    }),
    supabase.from('product_categories').select('id, name').order('name'),
    getCreditSettings(),
    getExchangeRates(),
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

  const filterParams = new URLSearchParams()
  if (statusFilter !== 'all') filterParams.set('status', statusFilter)
  if (typeFilter !== 'all') filterParams.set('type', typeFilter)
  if (categoryFilter !== 'all') filterParams.set('category', categoryFilter)
  if (queryFilter) filterParams.set('q', queryFilter)

  if (listResult.total > 0 && pageParam > listResult.totalPages) {
    filterParams.set('page', String(listResult.totalPages))
    redirect(`/admin/products?${filterParams.toString()}`)
  }

  const safePage = Math.min(pageIndex, Math.max(0, listResult.totalPages - 1))
  const categories = categoriesResult.data ?? []

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

      <form className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <select
            name="status"
            defaultValue={statusFilter}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            name="type"
            defaultValue={typeFilter}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All product types</option>
            <option value="digital">Digital</option>
            <option value="physical">Physical</option>
          </select>

          <select
            name="category"
            defaultValue={categoryFilter}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="q"
            defaultValue={queryFilter}
            placeholder="Search title..."
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />

          <div className="flex gap-2">
            <Button type="submit" variant="outline" className="h-10 flex-1">
              Filter
            </Button>
            <Button asChild type="button" variant="ghost" className="h-10">
              <Link href="/admin/products">Reset</Link>
            </Button>
          </div>
        </div>
      </form>

      <ProductsManager
        initialProducts={listResult.data as ProductRow[]}
        total={listResult.total}
        page={safePage}
        pageSize={listResult.pageSize}
        totalPages={listResult.totalPages}
        displayCurrency={creditSettings.checkoutCurrency}
        exchangeRates={exchangeRates}
        activeFilters={{
          status: statusFilter,
          type: typeFilter,
          category: categoryFilter,
          q: queryFilter,
        }}
      />
    </div>
  )
}
