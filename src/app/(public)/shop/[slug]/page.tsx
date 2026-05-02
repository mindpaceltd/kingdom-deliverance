import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, Download, ShieldCheck, HeartHandshake, Share2, Facebook, Twitter, MessageCircle, Mail, ChevronRight } from 'lucide-react'
import { AddToCartButton } from '@/components/shop/add-to-cart-button'
import { ProductGallery } from '@/components/shop/product-gallery'
import { ProductTabs } from '@/components/shop/product-tabs'

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
    openGraph: { title, description, images: ogImage ? [{ url: ogImage }] : [] },
  }
}

const RATE = 3800

function ugx(usd: number) {
  return Math.round(usd * RATE).toLocaleString()
}

export default async function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: product } = await supabase
    .from('products')
    .select(`*, category:product_categories(*), product_gallery(*)`)
    .eq('slug', params.slug)
    .single()

  if (!product) notFound()

  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*, category:product_categories(name)')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4)

  const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
  const displayPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)
  const savingsUGX = hasDiscount ? Math.round((product.regular_price_usd - product.sale_price_usd) * RATE) : 0
  const savingsPct = hasDiscount ? Math.round((1 - product.sale_price_usd / product.regular_price_usd) * 100) : 0

  // Determine if product has format variations
  const hasFormats = product.type === 'digital'

  const additionalInfo = [
    { label: 'Format', value: product.type === 'digital' ? 'Digital (PDF/eBook)' : 'Physical' },
    { label: 'Access', value: product.type === 'digital' ? 'Instant Download' : 'Express Shipping' },
    { label: 'Language', value: 'English' },
    { label: 'Category', value: product.category?.name || 'General' },
    { label: 'SKU', value: `KDC-${product.id?.toString().slice(0, 8).toUpperCase()}` },
  ]

  const trustBadges = [
    { icon: Download, label: 'Instant Download', sub: 'After Purchase' },
    { icon: ShieldCheck, label: 'Secure Payment', sub: '100% Safe & Secure' },
    { icon: HeartHandshake, label: 'Support Ministry', sub: 'Every Purchase Helps' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main product area */}
      <div className="pt-20 lg:pt-24">
        <div className="container px-4 mx-auto max-w-6xl">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[12px] text-gray-400 py-4">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/shop" className="hover:text-gray-700">Shop</Link>
            <ChevronRight className="w-3 h-3" />
            {product.category && (
              <>
                <Link href={`/shop?category=${product.category.slug}`} className="hover:text-gray-700">
                  {product.category.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-gray-600 font-medium line-clamp-1">{product.name}</span>
          </nav>

          {/* ── PRODUCT HERO: 2-col grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pb-16">

            {/* LEFT: Gallery */}
            <div className="space-y-4">
              {/* Main image with badges */}
              <div className="relative rounded-lg overflow-hidden bg-white border border-gray-200">
                {hasDiscount && (
                  <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-black uppercase px-2.5 py-1 rounded">
                    SALE!
                  </span>
                )}
                <span className="absolute top-3 right-3 z-10 bg-[#1e3a5f] text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded">
                  {product.type === 'digital' ? 'DIGITAL' : 'PHYSICAL'}
                </span>
                <img
                  src={product.image_url}
                  alt={product.image_alt || product.name}
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>

              {/* Thumbnail strip */}
              <ProductGallery
                mainImage={product.image_url}
                gallery={product.product_gallery}
                name={product.name}
                thumbnailOnly
              />
            </div>

            {/* RIGHT: Purchase info */}
            <div className="flex flex-col">
              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight mb-3">
                {product.name}
              </h1>

              {/* Stars */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#f5a623] text-[#f5a623]" />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({product.review_count || 24} customer reviews)</span>
              </div>

              {/* Price block */}
              <div className="mb-4">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl font-black text-gray-900">
                    UGX {ugx(displayPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-gray-400 line-through">
                      UGX {ugx(product.regular_price_usd)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <p className="text-sm text-green-600 font-semibold mt-1">
                    You save: UGX {savingsUGX.toLocaleString()} ({savingsPct}%)
                  </p>
                )}
              </div>

              {/* Short description */}
              {product.short_description && (
                <p className="text-sm text-gray-600 leading-relaxed mb-5 border-l-2 border-[#d4a017] pl-3">
                  {product.short_description}
                </p>
              )}

              {/* Format selector (only for digital/variable products) */}
              {hasFormats && (
                <div className="mb-5">
                  <p className="text-sm font-bold text-gray-700 mb-2">Format</p>
                  <div className="flex gap-2 flex-wrap">
                    {['eBook (PDF)', 'Audiobook (MP3)', 'Paperback'].map((fmt, i) => (
                      <button
                        key={fmt}
                        className={`px-4 py-1.5 rounded border text-sm font-medium transition-colors ${
                          i === 0
                            ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#1e3a5f]'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-5">
                <p className="text-sm font-bold text-gray-700 mb-2">Quantity</p>
                <QuantitySelector />
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 mb-6">
                <AddToCartButton
                  product={{ ...product, price_usd: displayPrice }}
                  className="w-full bg-[#d4a017] hover:bg-[#b88a12] text-white font-bold py-3.5 rounded-lg text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-colors"
                  iconClassName="w-4 h-4"
                  label="Add to Cart"
                />
                <a
                  href={`/checkout?product=${product.id}`}
                  className="w-full bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-bold py-3.5 rounded-lg text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-colors"
                >
                  Buy Now
                </a>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 py-5 border-t border-b border-gray-200 mb-5">
                {trustBadges.map((b) => (
                  <div key={b.label} className="flex flex-col items-center text-center gap-1">
                    <b.icon className="w-5 h-5 text-[#1e3a5f]" />
                    <p className="text-[11px] font-bold text-gray-700 leading-tight">{b.label}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{b.sub}</p>
                  </div>
                ))}
              </div>

              {/* Meta info */}
              <div className="space-y-1.5 text-[12px] text-gray-500">
                <p>
                  <span className="font-semibold text-gray-700">SKU:</span> KDC-{product.id?.toString().slice(0, 8).toUpperCase()}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Category:</span>{' '}
                  <Link href={`/shop?category=${product.category?.slug}`} className="text-[#1e3a5f] hover:underline">
                    {product.category?.name || 'General'}
                  </Link>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-semibold text-gray-700">Share:</span>
                  <div className="flex gap-2">
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=https://kdcuganda.org/shop/${product.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                      <Facebook className="w-4 h-4" />
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=https://kdcuganda.org/shop/${product.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-500 transition-colors">
                      <Twitter className="w-4 h-4" />
                    </a>
                    <a href={`https://wa.me/?text=https://kdcuganda.org/shop/${product.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                    <a href={`mailto:?body=https://kdcuganda.org/shop/${product.slug}`} className="text-gray-400 hover:text-gray-700 transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── PRODUCT TABS ── */}
          <div className="mb-16 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <ProductTabs
              description={product.description}
              additionalInfo={additionalInfo}
            />
          </div>

          {/* ── RELATED PRODUCTS ── */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900">You May Also Like</h3>
                <Link href="/shop" className="text-sm text-[#1e3a5f] hover:underline font-medium">
                  Browse All →
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedProducts.map((p) => {
                  const pHasDiscount = p.sale_price_usd > 0 && p.sale_price_usd < p.regular_price_usd
                  const pPrice = pHasDiscount ? p.sale_price_usd : (p.regular_price_usd || p.price_usd)
                  return (
                    <Link key={p.id} href={`/shop/${p.slug}`} className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {pHasDiscount && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">SALE</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-gray-400 mb-0.5">{p.category?.name}</p>
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1">{p.name}</h4>
                        <p className="text-sm font-black text-gray-800">UGX {ugx(pPrice)}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// Client component for quantity selector
function QuantitySelector() {
  return (
    <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
      <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-bold text-lg border-r border-gray-300 transition-colors">−</button>
      <span className="px-5 py-2 text-sm font-bold text-gray-900 min-w-[40px] text-center">1</span>
      <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-bold text-lg border-l border-gray-300 transition-colors">+</button>
    </div>
  )
}
