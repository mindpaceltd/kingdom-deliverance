import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PlusIcon, Settings } from 'lucide-react'
import Link from 'next/link'

export default async function AdminAttributesPage() {
  const supabase = createClient()
  
  const { data: attributes } = await supabase
    .from('product_attributes')
    .select('*, product_attribute_values(*)')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Attributes</h1>
          <p className="text-muted-foreground">Define variations like Size, Color, or Material for your products.</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/attributes/new">
            <PlusIcon className="mr-2 h-4 w-4" /> Add Attribute
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {attributes && attributes.length > 0 ? (
          attributes.map((attr) => (
            <div key={attr.id} className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" /> {attr.name}
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/products/attributes/${attr.id}`}>Edit</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {attr.product_attribute_values?.map((val: any) => (
                  <span key={val.id} className="px-2 py-1 bg-muted rounded text-xs font-medium">
                    {val.value}
                  </span>
                ))}
                {(!attr.product_attribute_values || attr.product_attribute_values.length === 0) && (
                  <span className="text-xs text-muted-foreground italic">No values defined yet.</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No attributes found. Create "Size" or "Color" to get started.
          </div>
        )}
      </div>
    </div>
  )
}
