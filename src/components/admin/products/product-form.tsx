'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
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
import { 
  Loader2, 
  Save, 
  Package, 
  FileCode, 
  ImageIcon, 
  ExternalLink, 
  TrendingUp,
  DollarSign,
  Tag
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
    price_usd: initialData?.price_usd || 0, // Legacy fallback
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

    // Ensure price_usd is set correctly (use sale price if available, otherwise regular)
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
        {/* Title & Short Description */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-bold">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Deliverance E-book"
              className="h-12 text-lg"
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
            content={formData.description}
            onChange={(content) => setFormData({ ...formData, description: content })}
            placeholder="Write the full product details here..."
          />
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
              <p className="text-[10px] text-muted-foreground italic">Leave at 0 if no discount.</p>
            </div>
          </div>
          
          {formData.sale_price_usd > 0 && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <Tag className="h-4 w-4" />
              You are offering a <strong>{Math.round((1 - formData.sale_price_usd / formData.regular_price_usd) * 100)}% discount</strong>.
            </div>
          )}
        </div>

        {/* Digital/Physical Settings */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Fulfillment Options
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
              <div className="space-y-1">
                <Label>Product Type</Label>
                <p className="text-xs text-muted-foreground">Digital products send a download link after payment.</p>
              </div>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as any })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physical Product</SelectItem>
                  <SelectItem value="digital">Digital Download</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'digital' && (
              <div className="space-y-4 p-4 border rounded-xl border-accent/20 bg-accent/5 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="file_url" className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-accent" /> Secure Download URL
                  </Label>
                  <Input
                    id="file_url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="Link to file from Book system"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Like WooCommerce, this file is ONLY accessible after successful payment.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        {/* Status & Preview */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-bold">Featured Product</Label>
            <Switch
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="font-bold">Active Store Status</Label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
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
            <div className="space-y-2">
              <Label>Image URL (Featured/Org Image)</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Image Alt Text (for SEO)</Label>
              <Input
                value={formData.image_alt}
                onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
                placeholder="Describe image for search engines"
              />
            </div>
            {formData.image_url && (
              <div className="rounded-lg border overflow-hidden aspect-square bg-muted relative">
                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-[10px] font-bold">Featured</div>
              </div>
            )}
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

        {/* SEO Score */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">SEO Calculation</h3>
            <span className={cn(
              "text-xl font-black",
              seoScore > 80 ? "text-green-500" : seoScore > 50 ? "text-yellow-500" : "text-red-500"
            )}>{seoScore}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${seoScore}%` }}
              className={cn(
                "h-full transition-all duration-1000",
                seoScore > 80 ? "bg-green-500" : seoScore > 50 ? "bg-yellow-500" : "bg-red-500"
              )}
            />
          </div>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Meta Title</Label>
              <Input
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="Google Title..."
              />
              <div className="flex justify-between text-[10px] px-1">
                <span className={formData.meta_title.length > 60 ? "text-red-500" : "text-muted-foreground"}>{formData.meta_title.length} / 60</span>
                <span>Ideal: 30-60 chars</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Meta Description</Label>
              <Textarea
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Search engine summary..."
                rows={3}
              />
              <div className="flex justify-between text-[10px] px-1">
                <span className={formData.meta_description.length > 160 ? "text-red-500" : "text-muted-foreground"}>{formData.meta_description.length} / 160</span>
                <span>Ideal: 120-160 chars</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-6">
          <Button type="submit" disabled={loading} className="w-full h-14 gap-2 text-lg font-bold shadow-xl shadow-primary/20">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {initialData ? 'Update WooCommerce Product' : 'Publish Product'}
          </Button>
        </div>
      </div>
    </form>
  )
}
