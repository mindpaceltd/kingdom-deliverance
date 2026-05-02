import { AttributeForm } from '@/components/admin/products/attribute-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewAttributePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products/attributes">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Attribute</h1>
          <p className="text-sm text-muted-foreground">Define a new variation like Size or Color.</p>
        </div>
      </div>

      <AttributeForm />
    </div>
  )
}
