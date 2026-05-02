import { createClient } from '@/lib/supabase/server'
import { ShopFilters } from '@/components/shop/shop-filters'
import { ShopContent } from '@/components/shop/shop-content'
import { ShoppingBag, Zap, Lock, HeartHandshake, BookOpen } from 'lucide-react'

export async function generateMetadata() {
  return {
    title: 'Shop | Kingdom Deliverance Centre Uganda',
    description: 'Purchase e-books, sermons, and official Kingdom Deliverance Centre merchandise designed to support your spiritual growth.',
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; sort?: string }
}) {
  let products: any[] = []
  let categories: any[] = []
  let loadError = false

  try {
    const supabase = createClient()

    let query = supabase
      .from('products')
      .select(`*, category:product_categories(id, name, slug)`)
      .eq('is_active', true)

    if (searchParams.category) {
      const { data: cat } = await supabase
        .from('product_categories')
        .select('id')
        .eq('slug', searchParams.category)
        .single()
      if (cat) query = query.eq('category_id', cat.id)
    }

    if (searchParams.search) {
      query = query.ilike('name', `%${searchParams.search}%`)
    }

    const sortMap: Record<string, { column: string; ascending: boolean }> = {
      'latest': { column: 'created_at', ascending: false },
      'price-asc': { column: 'price_usd', ascending: true },
      'price-desc': { column: 'price_usd', ascending: false },
      'name': { column: 'name', ascending: true },
    }
    const sort = sortMap[searchParams.sort || 'latest'] || sortMap['latest']
    query = query.order(sort.column, { ascending: sort.ascending })

    const [productsRes, categoriesRes] = await Promise.all([
      query,
      supabase.from('product_categories').select('*').order('name')
    ])

    products = productsRes.data || []
    categories = categoriesRes.data || []
    loadError = Boolean(productsRes.error || categoriesRes.error)
  } catch {
    loadError = true
  }

  // Build per-category counts
  const productCounts: Record<string, number> = {}
  for (const p of products) {
    if (p.category_id) {
      productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1
    }
  }

  const trustBadges = [
    { icon: BookOpen, label: 'Spirit-filled Resources', sub: 'Carefully selected for your growth' },
    { icon: Zap, label: 'Instant Access', sub: 'Download and access immediately' },
    { icon: Lock, label: 'Secure Checkout', sub: 'Safe, fast and reliable payments' },
    { icon: HeartHandshake, label: 'Support Our Ministry', sub: 'Every purchase helps us reach more souls' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── HERO ── */}
      <section className="relative pt-28 pb-12 lg:pt-40 lg:pb-16 overflow-hidden">
        {/* Dark image background */}
        <div className="absolute inset-0 bg-[#0d1b2a]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1b2a] via-[#0d1b2a]/90 to-[#0d1b2a]/60" />

        <div className="relative z-10 container px-4 mx-auto">
          {/* Official badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4a017]/20 border border-[#d4a017]/40 text-[#d4a017] text-[11px] font-bold uppercase tracking-widest mb-6">
            <ShoppingBag className="w-3 h-3" />
            Official Ministry Store
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 max-w-2xl">
            Resources for{' '}
            <span className="italic text-[#d4a017]">Spirit &amp; Purpose</span>
          </h1>

          <p className="text-white/60 text-base max-w-xl mb-10 leading-relaxed">
            Explore our collection of e-books, recorded sermons, and church merchandise designed to support your spiritual growth.
          </p>

          {/* Trust badges row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            {trustBadges.map((b) => (
              <div key={b.label} className="flex items-start gap-3">
                <div className="mt-0.5 size-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-4 h-4 text-[#d4a017]" />
                </div>
                <div>
                  <p className="text-white text-[12px] font-bold leading-tight">{b.label}</p>
                  <p className="text-white/50 text-[10px] leading-snug">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHOP AREA ── */}
      <section className="py-10 flex-1">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar */}
            <aside className="w-full lg:w-56 xl:w-60 shrink-0">
              <ShopFilters
                categories={categories}
                productCounts={productCounts}
                totalCount={products.length}
              />
            </aside>

            {/* Products */}
            <ShopContent products={products} />
          </div>
        </div>
      </section>
    </div>
  )
}
