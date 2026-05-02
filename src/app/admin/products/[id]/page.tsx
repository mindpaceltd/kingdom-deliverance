import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/products/product-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const [productRes, categoriesRes] = await Promise.all([
    supabase.from('products').select('*, product_gallery(*)').eq('id', params.id).single(),
    supabase.from('product_categories').select('id, name').order('name')
  ])

  if (!productRes.data) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-sm text-muted-foreground">Modify details for "{productRes.data.name}"</p>
        </div>
      </div>

      <ProductForm initialData={productRes.data} categories={categoriesRes.data || []} />
    </div>
  )
}
