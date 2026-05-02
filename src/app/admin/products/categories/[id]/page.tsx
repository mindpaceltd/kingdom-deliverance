import { createClient } from '@/lib/supabase/server'
import { CategoryForm } from '@/components/admin/products/category-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: category } = await supabase
    .from('product_categories')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!category) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products/categories">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Category</h1>
          <p className="text-sm text-muted-foreground">Modify details for "{category.name}"</p>
        </div>
      </div>

      <CategoryForm initialData={category} />
    </div>
  )
}
