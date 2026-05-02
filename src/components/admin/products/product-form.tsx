'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveProduct } from '@/lib/actions/products'
import { Loader2, Save, Package, FileCode, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductFormProps {
  initialData?: any
  categories: any[]
}

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    id: initialData?.id || undefined,
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    price_usd: initialData?.price_usd || 0,
    type: initialData?.type || 'physical',
    category_id: initialData?.category_id || '',
    image_url: initialData?.image_url || '',
    file_url: initialData?.file_url || '',
    weight_kg: initialData?.weight_kg || 0,
    is_active: initialData?.is_active ?? true,
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await saveProduct(formData)
    setLoading(false)

    if (result.error) {
      alert(result.error)
    } else {
      router.push('/admin/products')
      router.refresh()
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Deliverance E-book"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product..."
              rows={8}
            />
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Inventory & Pricing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price_usd}
                onChange={(e) => setFormData({ ...formData, price_usd: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Product Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physical Product</SelectItem>
                  <SelectItem value="digital">Digital Download</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.type === 'physical' && (
            <div className="space-y-2 pt-2 animate-in fade-in duration-300">
              <Label htmlFor="weight">Weight (KG)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
              />
              <p className="text-[10px] text-muted-foreground italic">Used for shipping cost calculation.</p>
            </div>
          )}

          {formData.type === 'digital' && (
            <div className="space-y-2 pt-2 animate-in fade-in duration-300">
              <Label htmlFor="file_url" className="flex items-center gap-2">
                <FileCode className="h-4 w-4" /> Download File URL
              </Label>
              <Input
                id="file_url"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                placeholder="URL to the digital file (e.g. Supabase storage link)"
              />
              <p className="text-[10px] text-muted-foreground italic">This link will be sent to customers after purchase.</p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" /> Organization
          </h3>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(v) => setFormData({ ...formData, category_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Featured Image URL</Label>
            <Input
              id="image"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
            {formData.image_url && (
              <div className="mt-2 rounded-lg border overflow-hidden aspect-square bg-muted">
                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <Button type="submit" disabled={loading} className="w-full h-12 gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {initialData ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </div>
    </form>
  )
}
