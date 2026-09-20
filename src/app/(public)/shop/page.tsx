import { createClient } from '@/lib/supabase/server'
import { ShopFilters } from '@/components/shop/shop-filters'
import { ShopContent } from '@/components/shop/shop-content'
import { ShoppingBag, Zap, Lock, HeartHandshake, BookOpen } from 'lucide-react'
import type { Metadata } from 'next'
import { buildListPageMetadata } from '@/lib/seo/list-page-metadata'
import { pageKeywords } from '@/lib/seo/brand-keywords'

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
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
  let products: any[] = []
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

  const trustBadges = [
    { icon: BookOpen, label: 'Spirit-filled Resources', sub: 'Carefully selected for your growth' },
    { icon: Zap, label: 'Instant Access', sub: 'Download and access immediately' },
    { icon: Lock, label: 'Secure Checkout', sub: 'Safe, fast and reliable payments' },
    { icon: HeartHandshake, label: 'Support Our Ministry', sub: 'Every purchase helps us reach more souls' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <section className="relative overflow-hidden pb-12 pt-28 lg:pb-16 lg:pt-40">
        <div className="absolute inset-0 bg-[#0d1b2a]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b2a]/95 via-[#0d1b2a]/85 to-[#0d1b2a]/70" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a017]/40 bg-[#d4a017]/20 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#d4a017]">
              <ShoppingBag className="size-3" />
              Official Ministry Store
            </div>

            <h1 className="mb-4 max-w-2xl text-4xl font-black leading-tight text-white md:text-6xl">
              Resources for{' '}
              <span className="italic text-[#d4a017]">Spirit &amp; Purpose</span>
            </h1>

            <p className="mb-10 max-w-xl text-base leading-relaxed text-white/60">
              Explore our collection of e-books, recorded sermons, and church merchandise designed
              to support your spiritual growth.
            </p>

            <div className="grid w-full max-w-4xl grid-cols-2 justify-items-center gap-4 md:grid-cols-4 md:gap-6">
              {trustBadges.map((b) => (
                <div key={b.label} className="flex max-w-[160px] flex-col items-center gap-2 text-center">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <b.icon className="size-4 text-[#d4a017]" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[12px] font-bold leading-tight text-white">{b.label}</p>
                    <p className="text-[10px] leading-snug text-white/50">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 py-10">
        <div className="container mx-auto max-w-6xl px-4">
          {loadError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              The shop could not load products right now. Please refresh and try again.
            </p>
          ) : null}
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            <aside className="hidden w-full shrink-0 lg:block lg:w-[17.5rem] xl:w-80">
              <ShopFilters
                categories={categories}
                totalCount={catalogTotal}
                digitalCount={digitalCount}
                physicalCount={physicalCount}
                mode="desktop"
              />
            </aside>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="lg:hidden">
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
