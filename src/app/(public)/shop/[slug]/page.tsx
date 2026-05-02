import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Share2, CheckCircle2, ShieldCheck, Download, Truck } from 'lucide-react'
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
  const description = product.meta_description || product.description?.substring(0, 160)
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

  return (
    <div className="pt-32 pb-20 lg:pt-48 lg:pb-32 bg-white">
      <div className="container px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-muted border border-border shadow-2xl shadow-primary/5">
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-8 left-8">
                <span className="px-5 py-2 rounded-full bg-white/90 backdrop-blur-md border border-white text-xs font-bold uppercase tracking-widest text-primary shadow-lg">
                  {product.category?.name}
                </span>
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
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
                {product.name}
              </h1>
              <div className="text-4xl font-bold text-primary mb-8">
                {formatPrice(product.price_usd)}
              </div>
              <div className="prose prose-blue text-primary/70 leading-relaxed max-w-none">
                {product.description}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="p-4 rounded-2xl bg-muted/30 border border-muted flex flex-col gap-2">
                {product.type === 'digital' ? (
                  <>
                    <Download className="w-5 h-5 text-accent" />
                    <span className="text-xs font-bold text-primary uppercase">Direct Link</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-5 h-5 text-accent" />
                    <span className="text-xs font-bold text-primary uppercase">Safe Delivery</span>
                  </>
                )}
              </div>
              <div className="p-4 rounded-2xl bg-muted/30 border border-muted flex flex-col gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <span className="text-xs font-bold text-primary uppercase">Secure Payment</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <AddToCartButton product={product} className="flex-1 h-14 text-lg rounded-2xl" />
              <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-2">
                <Share2 className="w-5 h-5" />
              </Button>
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
