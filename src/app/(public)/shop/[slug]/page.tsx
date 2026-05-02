import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  Truck, 
  Tag, 
  Heart, 
  Info, 
  Star, 
  Zap, 
  ShieldAlert, 
  Users, 
  Target,
  ArrowRight
} from 'lucide-react'
import { AddToCartButton } from '@/components/shop/add-to-cart-button'
import { ProductGallery } from '@/components/shop/product-gallery'
import { ProductTabs } from '@/components/shop/product-tabs'
import { StickyAddToCart } from '@/components/shop/sticky-add-to-cart'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!product) return {}

  const title = product.meta_title || `${product.name} | KDC Uganda Store`
  const description = product.meta_description || product.short_description || product.description?.replace(/<[^>]*>?/gm, '').substring(0, 160)
  const ogImage = product.image_url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
    },
  }
}

export default async function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      category:product_categories(*),
      product_gallery(*)
    `)
    .eq('slug', params.slug)
    .single()

  if (!product) notFound()

  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4)

  const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
  const displayPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)

  const additionalInfo = [
    { label: 'Format', value: product.type === 'digital' ? 'Digital (PDF/eBook)' : 'Physical' },
    { label: 'Access', value: product.type === 'digital' ? 'Instant Download' : 'Express Shipping' },
    { label: 'Language', value: 'English' },
    { label: 'Category', value: product.category?.name || 'General' }
  ]

  return (
    <div className="relative min-h-screen bg-slate-50/50">
      <StickyAddToCart product={product} price={displayPrice} />

      {/* Background Atmosphere */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="container px-4 mx-auto">
          {/* Main Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-24 items-start mb-24">
            {/* Left: Image Gallery */}
            <div className="lg:col-span-7 lg:sticky lg:top-40">
              <ProductGallery 
                mainImage={product.image_url} 
                gallery={product.product_gallery} 
                name={product.name} 
              />
            </div>

            {/* Right: Purchase Info */}
            <div className="lg:col-span-5">
              <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-12 border border-white shadow-2xl shadow-primary/5">
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <span className="px-4 py-1.5 rounded-full bg-primary/5 text-[10px] font-black uppercase tracking-widest text-primary border border-primary/10">
                    {product.category?.name || 'Shop'}
                  </span>
                  {hasDiscount && (
                    <span className="px-4 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20">
                      Save {Math.round((1 - product.sale_price_usd / product.regular_price_usd) * 100)}%
                    </span>
                  )}
                </div>

                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-6 leading-[1.1] tracking-tight">
                  {product.name}
                </h1>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex text-accent">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">(124 Customer Reviews)</span>
                </div>

                <div className="flex items-baseline gap-4 mb-10">
                  <span className="text-5xl font-black text-primary tracking-tighter">
                    {formatPrice(displayPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-2xl text-muted-foreground line-through decoration-red-400 decoration-2 opacity-50">
                      {formatPrice(product.regular_price_usd)}
                    </span>
                  )}
                </div>

                {product.short_description && (
                  <div className="text-xl text-primary/80 leading-relaxed mb-10 italic font-light border-l-4 border-accent/20 pl-6">
                    {product.short_description}
                  </div>
                )}

                <div className="space-y-4 mb-12">
                  <AddToCartButton 
                    product={{...product, price_usd: displayPrice}} 
                    className="w-full h-20 text-xl font-black rounded-3xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all bg-primary" 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-14 rounded-2xl border-2 gap-2 font-bold uppercase tracking-widest text-[10px]">
                      <Share2 className="w-4 h-4" /> Share
                    </Button>
                    <Button variant="outline" className="h-14 rounded-2xl border-2 gap-2 font-bold uppercase tracking-widest text-[10px]">
                      <Heart className="w-4 h-4" /> Wishlist
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Secure Payments</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <Truck className="w-5 h-5 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Fast Fulfillment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Content Tabs */}
          <div className="mb-24">
            <ProductTabs 
              description={product.description} 
              additionalInfo={additionalInfo}
            />
          </div>

          {/* Landing Page Sections */}
          <div className="space-y-32 mb-32">
            {/* The Problem Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-100">
                  <ShieldAlert className="w-4 h-4" /> The Challenge
                </div>
                <h2 className="font-serif text-4xl lg:text-5xl font-black text-primary leading-tight">
                  Are emotional barriers holding you back?
                </h2>
                <p className="text-lg text-primary/70 leading-loose">
                  Many people struggle with lingering emotional pain, toxic relationship cycles, and a lack of true inner peace. Without a structured roadmap, it's easy to feel stuck in the same destructive patterns year after year.
                </p>
                <ul className="space-y-4">
                  {[
                    "Unresolved past trauma affecting your current joy",
                    "Difficulty establishing healthy, lasting boundaries",
                    "Frequent cycles of emotional instability and burnout",
                    "Feeling disconnected from your true self and purpose"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-primary/80 font-medium">
                      <div className="size-2 rounded-full bg-red-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative aspect-video rounded-[3rem] overflow-hidden bg-primary/5 border shadow-inner flex items-center justify-center p-12">
                 <ShieldAlert className="w-32 h-32 text-red-200 opacity-20 absolute" />
                 <p className="text-2xl font-serif italic text-primary/40 text-center">Identifying the roadblocks to your emotional freedom...</p>
              </div>
            </div>

            {/* The Solution Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="lg:order-2 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-100">
                  <Zap className="w-4 h-4" /> The Solution
                </div>
                <h2 className="font-serif text-4xl lg:text-5xl font-black text-primary leading-tight">
                  A proven framework for lasting transformation.
                </h2>
                <p className="text-lg text-primary/70 leading-loose">
                  This 30-day guide isn't just about reading—it's about doing. We provide a step-by-step spiritual and emotional framework designed to dismantle barriers and rebuild your foundations on truth and strength.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {[
                    { title: "Daily Roadmap", desc: "Clearly defined steps for every single day" },
                    { title: "Deep Healing", desc: "Techniques to address the root, not just symptoms" },
                    { title: "Relationship Tools", desc: "Frameworks for communication and trust" },
                    { title: "Spiritual Clarity", desc: "Alignment with your divine purpose" }
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-black text-primary mb-1 uppercase tracking-tighter">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl">
                 <img src={product.image_url} alt="The Solution" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
                 <div className="absolute bottom-12 left-12 right-12 text-white">
                    <p className="text-3xl font-serif font-black leading-tight italic">"The path to emotional freedom starts with a single step."</p>
                 </div>
              </div>
            </div>

            {/* Who This Is For Section */}
            <div className="bg-primary rounded-[4rem] p-12 lg:p-24 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/10 blur-[120px] rounded-full translate-x-1/2" />
               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                    <h2 className="font-serif text-4xl lg:text-6xl font-black mb-8 leading-tight">Is this guide for you?</h2>
                    <div className="space-y-6">
                       {[
                         { icon: Users, title: "Individuals", desc: "Seeking personal healing and emotional stability." },
                         { icon: Target, title: "Couples", desc: "Looking to strengthen their bond and communication." },
                         { icon: Zap, title: "Growth Seekers", desc: "Dedicated to continuous spiritual and mental evolution." }
                       ].map((item, i) => (
                         <div key={i} className="flex gap-6">
                            <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center shrink-0">
                               <item.icon className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                               <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                               <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-3xl rounded-3xl p-8 border border-white/10">
                     <h3 className="text-2xl font-serif font-bold mb-6">What users are saying...</h3>
                     <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-white text-primary">
                           <div className="flex gap-1 mb-3 text-accent">
                              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                           </div>
                           <p className="text-sm italic mb-4">"This guide completely changed how I approach my past. I feel lighter and more at peace than I have in years."</p>
                           <p className="text-xs font-black uppercase">— Sarah M., Kampala</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-white">
                           <div className="flex gap-1 mb-3 text-accent">
                              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                           </div>
                           <p className="text-sm italic mb-4">"A must-have for anyone serious about spiritual and emotional growth. The daily structure is brilliant."</p>
                           <p className="text-xs font-black uppercase">— John D., Entebbe</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-3xl font-black text-primary italic">You May Also Like</h3>
                <Link href="/shop" className="text-xs font-black uppercase tracking-widest text-accent hover:text-primary transition-colors flex items-center gap-2">
                  Browse Shop <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.map((p) => (
                  <Link key={p.id} href={`/shop/${p.slug}`} className="group bg-white rounded-3xl p-4 border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-2">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-4 relative">
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="font-bold text-primary mb-2 line-clamp-1 group-hover:text-accent transition-colors">{p.name}</h4>
                    <p className="text-lg font-black text-primary">{formatPrice(p.price_usd)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
