import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Share2, CheckCircle2, ShieldCheck, Download, Truck, Tag } from 'lucide-react'
import { AddToCartButton } from '@/components/shop/add-to-cart-button'

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
      category:product_categories(*)
    `)
    .eq('slug', params.slug)
    .single()

  if (!product) notFound()

  const hasDiscount = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd
  const displayPrice = hasDiscount ? product.sale_price_usd : (product.regular_price_usd || product.price_usd)

  return (
    <div className="pt-32 pb-20 lg:pt-48 lg:pb-32 bg-white">
      <div className="container px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-muted border border-border shadow-2xl shadow-primary/5">
              <img 
                src={product.image_url} 
                alt={product.image_alt || product.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-8 left-8 flex flex-col gap-3">
                <span className="px-5 py-2 rounded-full bg-white/90 backdrop-blur-md border border-white text-xs font-bold uppercase tracking-widest text-primary shadow-lg self-start">
                  {product.category?.name}
                </span>
                {hasDiscount && (
                  <span className="px-4 py-2 rounded-full bg-red-500 text-white text-xs font-bold uppercase tracking-widest shadow-xl self-start animate-bounce">
                    Sale
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  {product.type === 'digital' ? 'Instant Digital Access' : 'Physical Quality Merchandise'}
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4 leading-tight">
                {product.name}
              </h1>
              
              {/* Pricing */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-muted-foreground line-through decoration-red-400">
                    {formatPrice(product.regular_price_usd)}
                  </span>
                )}
              </div>

              {/* Short Description */}
              {product.short_description && (
                <div className="text-lg text-primary/80 italic mb-8 border-l-4 border-accent/30 pl-4">
                  {product.short_description}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="p-4 rounded-2xl bg-muted/30 border border-muted flex flex-col gap-2">
                {product.type === 'digital' ? (
                  <>
                    <Download className="w-5 h-5 text-accent" />
                    <span className="text-xs font-bold text-primary uppercase">Secure Link</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-5 h-5 text-accent" />
                    <span className="text-xs font-bold text-primary uppercase">Global Delivery</span>
                  </>
                )}
              </div>
              <div className="p-4 rounded-2xl bg-muted/30 border border-muted flex flex-col gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <span className="text-xs font-bold text-primary uppercase">Safe Checkout</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <AddToCartButton 
                product={{...product, price_usd: displayPrice}} 
                className="flex-1 h-14 text-lg rounded-2xl shadow-xl shadow-primary/10" 
              />
              <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-2">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Full Description (Rich Text) */}
            <div className="space-y-4 pt-8 border-t border-border">
              <h3 className="font-bold text-lg text-primary uppercase tracking-wider">Product Details</h3>
              <div 
                className="prose prose-blue max-w-none text-primary/70 leading-relaxed rich-text-content"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>

            <div className="mt-10 pt-10 border-t border-border space-y-4">
              <div className="flex items-center gap-3 text-sm text-primary/70">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Verified Ministry Resource</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-primary/70">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Supports Kingdom Work in Uganda</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
