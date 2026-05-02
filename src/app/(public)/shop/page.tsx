import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { ProductCard } from '@/components/shop/product-card'
import { ShopFilters } from '@/components/shop/shop-filters'
import { ShoppingBag } from 'lucide-react'

export async function generateMetadata() {
  return {
    title: 'Shop',
    description: 'Purchase e-books, sermons, and official Kingdom Deliverance Centre merchandise.',
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string }
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('products')
    .select(`
      *,
      category:product_categories(name, slug)
    `)
    .eq('is_active', true)

  if (searchParams.category) {
    query = query.eq('product_categories.slug', searchParams.category)
  }

  if (searchParams.search) {
    query = query.ilike('name', `%${searchParams.search}%`)
  }

  const [productsRes, categoriesRes] = await Promise.all([
    query.order('created_at', { ascending: false }),
    supabase.from('product_categories').select('*').order('name')
  ])

  const products = productsRes.data || []
  const categories = categoriesRes.data || []

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 bg-[#0d1b3e] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-transparent" />
        
        <div className="container relative z-10 px-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-bold uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <ShoppingBag className="w-3 h-3" />
              Official Ministry Store
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
              Equip Your <span className="text-accent italic">Spirit</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Explore our collection of e-books, recorded sermons, and church merchandise designed to support your spiritual growth.
            </p>
          </div>
        </div>
      </section>

      {/* Main Shop Area */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container px-4">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 shrink-0">
              <ShopFilters categories={categories} />
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-8">
                <p className="text-muted-foreground">
                  Showing <span className="font-bold text-primary">{products.length}</span> products
                </p>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center rounded-3xl border-2 border-dashed border-muted bg-muted/20">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-primary mb-2">No products found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
