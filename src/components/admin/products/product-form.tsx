'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveProduct } from '@/lib/actions/products'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { MediaPicker } from '@/components/admin/media-picker'
import { 
  Loader2, 
  Save, 
  Package, 
  FileCode, 
  ImageIcon, 
  ExternalLink, 
  DollarSign,
  Tag,
  Plus,
  X,
  Copy,
  Download,
  Upload
} from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'

interface ProductFormProps {
  initialData?: any
  categories: any[]
}

const EXCHANGE_RATE = 3800 // 1 USD = 3800 UGX

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [currency, setCurrency] = React.useState<'USD' | 'UGX'>('USD')
  const [formData, setFormData] = React.useState({
    id: initialData?.id || undefined,
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    short_description: initialData?.short_description || '',
    description: initialData?.description || '',
    regular_price_usd: initialData?.regular_price_usd || 0,
    sale_price_usd: initialData?.sale_price_usd || 0,
    price_usd: initialData?.price_usd || 0,
    type: initialData?.type || 'physical',
    category_id: initialData?.category_id || '',
    image_url: initialData?.image_url || '',
    image_alt: initialData?.image_alt || '',
    file_url: initialData?.file_url || '',
    weight_kg: initialData?.weight_kg || 0,
    is_active: initialData?.is_active ?? true,
    is_featured: initialData?.is_featured ?? false,
    meta_title: initialData?.meta_title || '',
    meta_description: initialData?.meta_description || '',
    status: initialData?.status || 'published',
    gallery: initialData?.product_gallery?.map((g: any) => g.image_url) || []
  })

  const seoScore = React.useMemo(() => {
    let score = 0
    if (formData.meta_title.length >= 30 && formData.meta_title.length <= 60) score += 30
    if (formData.meta_description.length >= 120 && formData.meta_description.length <= 160) score += 40
    if (formData.image_alt) score += 15
    if (formData.description.length > 200) score += 15
    return score
  }, [formData])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const finalData = {
      ...formData,
      price_usd: formData.sale_price_usd > 0 ? formData.sale_price_usd : formData.regular_price_usd
    }

    const result = await saveProduct(finalData)
    setLoading(false)

    if (result.error) {
      alert(result.error)
    } else {
      router.push('/admin/products')
      router.refresh()
    }
  }

  const handleDuplicate = () => {
    const { id, slug, ...rest } = formData
    setFormData({
      ...rest,
      id: undefined,
      name: `${formData.name} (Copy)`,
      slug: `${formData.slug}-copy`,
      status: 'draft'
    })
    alert("Product details copied. Click Publish to save as a new product.")
  }

  const addGalleryImage = (url: string) => {
    setFormData({ ...formData, gallery: [...formData.gallery, url] })
  }

  const removeGalleryImage = (index: number) => {
    const newGallery = formData.gallery.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, gallery: newGallery })
  }

  const convertPrice = (val: number) => {
    if (currency === 'UGX') return val * EXCHANGE_RATE
    return val
  }

  const handlePriceChange = (field: 'regular_price_usd' | 'sale_price_usd', value: string) => {
    const num = parseFloat(value) || 0
    const finalVal = currency === 'UGX' ? num / EXCHANGE_RATE : num
    setFormData({ ...formData, [field]: finalVal })
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
      <div className="lg:col-span-8 space-y-6">
        {/* Bulk Tools Toolbar */}
        <div className="flex items-center justify-between bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleDuplicate}>
              <Copy className="h-4 w-4" /> Duplicate
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
          </div>
          <div className="text-xs text-muted-foreground italic">
            WordPress-style Bulk Management
          </div>
        </div>

        {/* Title & Short Description */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-bold">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Deliverance E-book"
              className="h-12 text-lg font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Short Description (Appears near price)</Label>
            <Textarea
              id="short_description"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              placeholder="Brief summary of the product..."
              rows={3}
            />
          </div>
        </div>

        {/* Full Description (Rich Text) */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <Label className="text-base font-bold">Product Full Description</Label>
          <RichTextEditor
            value={formData.description}
            onChange={(content) => setFormData({ ...formData, description: content })}
            placeholder="Write the full product details here..."
          />
        </div>

        {/* Product Gallery */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" /> Product Gallery
            </h3>
            <MediaPicker
              onSelect={addGalleryImage}
              label="Add Images"
              accept="image"
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {formData.gallery.map((url: string, index: number) => (
              <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group bg-muted">
                <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {formData.gallery.length === 0 && (
              <div className="col-span-full py-8 text-center border-2 border-dashed rounded-xl text-muted-foreground text-sm">
                No gallery images added. Multiple images help sales!
              </div>
            )}
          </div>
        </div>

        {/* Digital Product Section */}
        <div className="bg-card border-2 border-accent/20 rounded-xl p-6 shadow-sm space-y-4 bg-accent/5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FileCode className="h-5 w-5 text-accent" /> Product Type & Digital Assets
            </h3>
            <Select
              value={formData.type}
              onValueChange={(v: any) => setFormData({ ...formData, type: v })}
            >
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Physical Product</SelectItem>
                <SelectItem value="digital">Digital Product</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'digital' && (
            <div className="p-4 rounded-xl bg-white border border-accent/20 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="font-bold">Downloadable File</Label>
                  <p className="text-xs text-muted-foreground">This file will be available to customers after purchase.</p>
                </div>
                <MediaPicker
                  onSelect={(url) => setFormData({ ...formData, file_url: url })}
                  label={formData.file_url ? "Change File" : "Select/Upload File"}
                  accept="all"
                />
              </div>
              
              {formData.file_url ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border overflow-hidden">
                  <div className="size-10 rounded bg-accent/10 flex items-center justify-center shrink-0">
                    <FileCode className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{formData.file_url.split('/').pop()}</p>
                    <p className="text-[10px] text-muted-foreground">Digital asset ready for delivery</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, file_url: '' })}
                    className="text-red-500 hover:text-red-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center border-2 border-dashed rounded-xl text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 opacity-20" />
                  <span>No file attached. Digital products MUST have a download file.</span>
                </div>
              )}
            </div>
          )}

          {formData.type === 'physical' && (
            <div className="p-4 rounded-xl bg-white border space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label htmlFor="weight">Shipping Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="any"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pricing Section */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" /> Pricing & Multi-Currency
            </h3>
            <div className="flex items-center bg-muted p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={cn("px-3 py-1 rounded text-xs font-bold transition-all", currency === 'USD' ? "bg-white shadow text-primary" : "text-muted-foreground")}
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency('UGX')}
                className={cn("px-3 py-1 rounded text-xs font-bold transition-all", currency === 'UGX' ? "bg-white shadow text-primary" : "text-muted-foreground")}
              >
                UGX
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="regular_price">Regular Price ({currency})</Label>
              <Input
                id="regular_price"
                type="number"
                step="any"
                value={convertPrice(formData.regular_price_usd)}
                onChange={(e) => handlePriceChange('regular_price_usd', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_price">Sale Price ({currency})</Label>
              <Input
                id="sale_price"
                type="number"
                step="any"
                value={convertPrice(formData.sale_price_usd)}
                onChange={(e) => handlePriceChange('sale_price_usd', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        {/* Status & Visibility */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-bold">Product Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-bold">Featured Product</Label>
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
            </div>
          </div>
          
          <Button asChild variant="outline" className="w-full gap-2 mt-2">
            <Link href={`/shop/${formData.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" /> Preview Product
            </Link>
          </Button>
        </div>

        {/* Featured Image */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" /> Featured Image
          </h3>
          <div className="space-y-4">
            <MediaPicker
              value={formData.image_url}
              onSelect={(url) => setFormData({ ...formData, image_url: url })}
              label={formData.image_url ? 'Replace Image' : 'Select Featured Image'}
              accept="image"
            />
            <div className="space-y-2">
              <Label>Image Alt Text (SEO)</Label>
              <Input
                value={formData.image_alt}
                onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
                placeholder="Describe image..."
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <Label htmlFor="category" className="font-bold">Category</Label>
          <Select
            value={formData.category_id}
            onValueChange={(v) => setFormData({ ...formData, category_id: v })}
          >
            <SelectTrigger>
              <SelectValue>
                {categories.find(c => c.id === formData.category_id)?.name || "Select Category"}
              </SelectValue>
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

        {/* SEO Score - ENHANCED VISIBILITY */}
        <div className="bg-card border-2 border-primary/20 rounded-xl p-6 shadow-lg space-y-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg tracking-tighter uppercase">Overall SEO Score</h3>
            <span className={cn(
              "text-3xl font-black",
              seoScore > 80 ? "text-green-500" : seoScore > 50 ? "text-yellow-500" : "text-red-500"
            )}>{seoScore}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden border">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${seoScore}%` }}
              className={cn(
                "h-full transition-all duration-1000",
                seoScore > 80 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : 
                seoScore > 50 ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" : 
                "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              )}
            />
          </div>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Search Engine Title</Label>
              <Input
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="Google Title..."
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Search Engine Description</Label>
              <Textarea
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Search engine summary..."
                rows={3}
                className="bg-white"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-6">
          <Button type="submit" disabled={loading} className="w-full h-16 gap-2 text-xl font-black shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 transition-all active:scale-95">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
            {formData.status === 'draft' ? 'Save as Draft' : (initialData ? 'Update Product' : 'Publish Product')}
          </Button>
        </div>
      </div>
    </form>
  )
}
