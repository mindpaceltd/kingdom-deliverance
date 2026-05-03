'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload, Loader2, FileSpreadsheet, Copy } from 'lucide-react'
import { exportProductsToCSV, importProductsFromCSV } from '@/lib/actions/bulk-products'
import { duplicateProduct } from '@/lib/actions/products'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'

export function ProductBulkActions() {
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setLoading(true)
    const result = await exportProductsToCSV()
    setLoading(false)
    
    if (result.error) {
      alert(result.error)
      return
    }

    const blob = new Blob([result.csv!], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await importProductsFromCSV(results.data)
        setLoading(false)
        if (res.error) {
          alert(res.error)
        } else {
          alert(`Successfully imported ${res.count} products.`)
          router.refresh()
        }
      }
    })
  }

  const downloadTemplate = () => {
    const headers = 'Name,Slug,Regular Price (USD),Sale Price (USD),Type,Category,Stock Status,Featured Image URL,Featured Image Alt Text,Short Description,Description,File URL,Download Limit,Download Expiry Days,Is Featured,Status'
    const example = 'Deliverance Book,deliverance-book,15,10,digital,Books,instock,https://.../cover.jpg,Deliverance book cover,A short summary of the book,Full HTML or text description,https://.../book.pdf,-1,-1,yes,published'
    const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'product-import-template.csv'
    link.click()
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 text-xs">
        <FileSpreadsheet className="h-3.5 w-3.5" /> Template
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Export
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Import
      </Button>
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".csv" 
        className="hidden" 
        onChange={handleImport}
      />
    </div>
  )
}

export function DuplicateProductButton({ productId }: { productId: string }) {
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleDuplicate = async () => {
    if (!confirm('Duplicate this product?')) return
    setLoading(true)
    const res = await duplicateProduct(productId)
    setLoading(false)
    
    if (res.error) {
      alert(res.error)
    } else {
      router.push(`/admin/products/${res.id}`)
      router.refresh()
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDuplicate} disabled={loading} className="text-muted-foreground hover:text-primary">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}
