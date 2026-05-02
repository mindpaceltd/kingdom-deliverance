import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/products/product-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewProductPage() {
  const supabase = createClient()
  
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name')
    .order('name')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-sm text-muted-foreground">Create a new digital or physical item for your store.</p>
        </div>
      </div>

      <ProductForm categories={categories || []} />
    </div>
  )
}
