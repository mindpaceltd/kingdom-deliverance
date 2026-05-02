import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PlusIcon, FolderIcon } from 'lucide-react'
import Link from 'next/link'

export default async function AdminCategoriesPage() {
  const supabase = createClient()
  
  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Categories</h1>
          <p className="text-muted-foreground">Organize your shop into sections like E-books, Clothing, and Sermons.</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/categories/new">
            <PlusIcon className="mr-2 h-4 w-4" /> Add Category
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Category Name</th>
                <th className="px-6 py-4 font-semibold">Slug</th>
                <th className="px-6 py-4 font-semibold">SEO Title</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <FolderIcon className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-primary">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">
                      {cat.slug}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">
                      {cat.meta_title || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/products/categories/${cat.id}`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No categories found. Create one to organize your products.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
