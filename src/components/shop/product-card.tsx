'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingCart, ArrowUpRight } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useCurrency } from '@/lib/currency-context'
import { useRouter } from 'next/navigation'
import { getMediaProxyUrl, normalizeMediaUrl } from '@/lib/media-url'

export interface ShopProduct {
  id: string
  slug: string
  name: string
  type: 'digital' | 'physical'
  image_url: string
  regular_price_usd: number
  sale_price_usd: number
  price_usd: number
  short_description?: string | null
}

interface ProductCardProps { product: ShopProduct; view?: 'grid' | 'list' }

function ProductCardImage({ src, alt }: { src?: string | null; alt: string }) {
  const normalized = normalizeMediaUrl(src) || '/placeholder.svg'
  const proxyUrl = getMediaProxyUrl(src)
  // The browser fallback retries legacy media through the existing proxy.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={normalized} alt={alt} loading="lazy" className="h-full w-full object-contain transition duration-300 motion-safe:group-hover:scale-[1.03]" onError={e => {
    const target = e.currentTarget
    const current = target.getAttribute('src') || ''
    if (proxyUrl && !current.includes('/api/media/asset')) { target.src = proxyUrl; return }
    if (!current.endsWith('/placeholder.svg')) target.src = '/placeholder.svg'
  }} />
}

export function ProductCard({ product, view = 'grid' }: ProductCardProps) {
  const { addItem } = useCart()
  const { formatPrice } = useCurrency()
  const router = useRouter()
  const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
  const displayPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)
  const list = view === 'list'
  const handleAdd = (buy = false) => {
    addItem({ id: product.id, name: product.name, price: displayPrice, quantity: 1, image: product.image_url, type: product.type })
    if (buy) router.push('/cart')
  }
  return <article data-shop-product className={`group overflow-hidden rounded-2xl border border-[#0d1b3e]/10 bg-white transition duration-200 hover:border-[#cbb479] hover:shadow-md ${list ? 'flex' : 'flex h-full flex-col'}`}>
    <Link href={`/shop/${product.slug}`} aria-label={`View ${product.name}`} className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-[#eeeae2] ${list ? 'w-24 p-2 sm:w-40 sm:p-4' : 'aspect-[5/6] p-3 sm:p-4'}`}>
      <ProductCardImage src={product.image_url} alt={product.name} />
      {hasDiscount && <span className="absolute left-2 top-2 rounded-full bg-[#0d1b3e] px-2 py-1 text-[9px] font-semibold text-white">Sale</span>}
    </Link>
    <div className={`flex min-w-0 flex-1 flex-col ${list ? 'p-3 sm:p-5' : 'p-3'}`}>
      <p className="truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8a6a2d]">{product.type === 'digital' ? 'Digital download' : 'Physical product'}</p>
      <Link href={`/shop/${product.slug}`} className="mt-2 block"><h3 className={`line-clamp-2 font-semibold leading-5 text-[#0d1b3e] group-hover:text-[#806125] ${list ? 'text-sm sm:text-base' : 'min-h-10 text-xs sm:text-sm'}`}>{product.name}</h3></Link>
      {list && product.short_description && <p className="mt-2 hidden line-clamp-2 text-xs leading-5 text-slate-500 sm:block">{product.short_description}</p>}
      <div className="mb-3 mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="text-sm font-semibold text-[#0d1b3e] sm:text-base" suppressHydrationWarning>{displayPrice === 0 ? 'Free' : formatPrice(displayPrice)}</span>{hasDiscount && <span className="text-[10px] text-slate-400 line-through" suppressHydrationWarning>{formatPrice(product.regular_price_usd)}</span>}</div>
      <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={() => handleAdd()} aria-label={`Add ${product.name} to cart`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#0d1b3e]/15 text-[#0d1b3e] transition hover:bg-[#eeeae2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#947332]"><ShoppingCart size={16} aria-hidden="true" /></button>
        <button type="button" onClick={() => handleAdd(true)} aria-label={`Buy ${product.name} now`} className="flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl bg-[#0d1b3e] px-2 text-[10px] font-semibold text-white transition hover:bg-[#263b64] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#947332] sm:text-xs">Buy now <ArrowUpRight size={13} className="hidden sm:block" aria-hidden="true" /></button>
      </div>
    </div>
  </article>
}
