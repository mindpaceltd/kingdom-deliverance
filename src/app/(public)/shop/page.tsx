import { createClient } from '@/lib/supabase/server'
import { ShopFilters } from '@/components/shop/shop-filters'
import { ShopContent } from '@/components/shop/shop-content'
import type { ShopProduct } from '@/components/shop/product-card'
import Link from 'next/link'
import { ArrowDown, BookOpen, Download } from 'lucide-react'
import type { Metadata } from 'next'
import { buildListPageMetadata } from '@/lib/seo/list-page-metadata'
import { pageKeywords } from '@/lib/seo/brand-keywords'

export async function generateMetadata({ searchParams }: { searchParams: Record<string, string | undefined> }): Promise<Metadata> {
  return buildListPageMetadata({
    searchParams,
    title: 'Shop',
    description:
      'Purchase e-books, sermons, and official Kingdom Deliverance Centre merchandise to support your spiritual growth.',
    path: '/shop',
    keywords: pageKeywords('shop'),
    ogType: 'product',
  })
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: {
    category?: string
    search?: string
    sort?: string
    page?: string
    type?: string
  }
}) {
  let products: ShopProduct[] = []
  let categories: { id: string; name: string; slug: string; count: number }[] = []
  let filteredCount = 0
  let catalogTotal = 0
  let digitalCount = 0
  let physicalCount = 0
  let loadError = false
  const pageSize = 20
  const currentPage = Math.max(1, Number(searchParams.page || '1') || 1)
  const from = (currentPage - 1) * pageSize
  const to = from + pageSize - 1
  const productType =
    searchParams.type === 'digital' || searchParams.type === 'physical'
      ? searchParams.type
      : null

  try {
    const supabase = createClient()

    let query = supabase
      .from('products')
      .select(`*, category:product_categories(id, name, slug)`, { count: 'exact' })
      .eq('is_active', true)
      .eq('status', 'published')

    if (productType) {
      query = query.eq('type', productType)
    }

    if (searchParams.category) {
      const { data: cat } = await supabase
        .from('product_categories')
        .select('id')
        .eq('slug', searchParams.category)
        .maybeSingle()
      if (cat) query = query.eq('category_id', cat.id)
    }

    if (searchParams.search) {
      query = query.ilike('name', `%${searchParams.search}%`)
    }

    const sortMap: Record<string, { column: string; ascending: boolean }> = {
      latest: { column: 'created_at', ascending: false },
      'price-asc': { column: 'regular_price_usd', ascending: true },
      'price-desc': { column: 'regular_price_usd', ascending: false },
      name: { column: 'name', ascending: true },
    }
    const sort = sortMap[searchParams.sort || 'latest'] || sortMap.latest
    query = query.order(sort.column, { ascending: sort.ascending }).range(from, to)

    const [productsRes, categoriesRes, countRowsRes, typeRowsRes] = await Promise.all([
      query,
      supabase.from('product_categories').select('id, name, slug').order('name'),
      supabase
        .from('products')
        .select('category_id')
        .eq('is_active', true)
        .eq('status', 'published'),
      supabase
        .from('products')
        .select('type')
        .eq('is_active', true)
        .eq('status', 'published'),
    ])

    products = productsRes.data || []
    filteredCount = productsRes.count || 0
    loadError = Boolean(
      productsRes.error || categoriesRes.error || countRowsRes.error || typeRowsRes.error
    )

    const productCounts: Record<string, number> = {}
    for (const row of countRowsRes.data || []) {
      if (!row.category_id) continue
      productCounts[row.category_id] = (productCounts[row.category_id] || 0) + 1
    }

    for (const row of typeRowsRes.data || []) {
      catalogTotal += 1
      if (row.type === 'digital') digitalCount += 1
      else if (row.type === 'physical') physicalCount += 1
    }

    categories = (categoriesRes.data || [])
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.id,
        count: productCounts[cat.id] || 0,
      }))
      .filter((cat) => cat.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  } catch {
    loadError = true
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f4] pt-[89px] sm:pt-[105px]">
      <section aria-labelledby="shop-title" className="border-b border-[#e8e1d5] bg-[#0d1b3e] text-white">
        <div className="container grid items-center gap-6 px-4 py-8 md:grid-cols-[1fr_auto] md:px-6 md:py-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e7ca83]">KDC Ministry Store</p>
            <h1 id="shop-title" className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">Resources for your <span className="text-[#e7ca83]">faith.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">Explore books, teaching and ministry resources to help you grow in the Word and live your faith.</p>
            <Link href="#shop-catalog" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e7ca83] px-5 py-2 text-sm font-semibold text-[#0d1b3e] transition hover:bg-[#f4dca2]">Browse the collection <ArrowDown size={16} aria-hidden="true" /></Link>
          </div>
          <div className="hidden gap-3 md:flex md:max-w-xs md:flex-col" aria-label="Store formats">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3"><BookOpen size={21} className="text-[#e7ca83]" aria-hidden="true" /><div><p className="text-sm font-semibold">Books &amp; teaching</p><p className="mt-1 text-xs text-white/60">Resources for your next step</p></div></div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3"><Download size={21} className="text-[#e7ca83]" aria-hidden="true" /><div><p className="text-sm font-semibold">Digital &amp; physical formats</p><p className="mt-1 text-xs text-white/60">Choose what works for you</p></div></div>
          </div>
        </div>
      </section>

      <section id="shop-catalog" aria-label="Shop catalog" className="flex-1 scroll-mt-28 py-6 md:py-8">
        <div className="container px-4 md:px-6">
          {loadError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              The shop could not load products right now. Please refresh and try again.
            </p>
          ) : null}
          <div className="flex flex-col gap-5 xl:flex-row xl:gap-6">
            <aside className="hidden w-56 shrink-0 xl:block">
              <ShopFilters
                categories={categories}
                totalCount={catalogTotal}
                digitalCount={digitalCount}
                physicalCount={physicalCount}
                mode="desktop"
              />
            </aside>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="xl:hidden">
                <ShopFilters
                  categories={categories}
                  totalCount={catalogTotal}
                  digitalCount={digitalCount}
                  physicalCount={physicalCount}
                  mode="mobile"
                />
              </div>
              <ShopContent
                products={products}
                currentPage={currentPage}
                totalCount={filteredCount}
                pageSize={pageSize}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
