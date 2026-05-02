import { createClient } from '@/lib/supabase/server'
import { AttributeForm } from '@/components/admin/products/attribute-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditAttributePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: attribute } = await supabase
    .from('product_attributes')
    .select('*, product_attribute_values(*)')
    .eq('id', params.id)
    .single()

  if (!attribute) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products/attributes">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Attribute</h1>
          <p className="text-sm text-muted-foreground">Modify values for "{attribute.name}"</p>
        </div>
      </div>

      <AttributeForm initialData={attribute} />
    </div>
  )
}
