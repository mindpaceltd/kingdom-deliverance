'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload, Loader2, FileSpreadsheet, Copy, Trash2, Globe } from 'lucide-react'
import { exportProductsToCSV, importProductsFromCSV } from '@/lib/actions/bulk-products'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProductBulkActionsProps {
  selectedCount?: number
  onBulkDelete?: () => void
  onBulkDuplicate?: () => void
  onBulkIndex?: () => void
  actionsDisabled?: boolean
  onClearSelection?: () => void
}

const MAPPABLE_FIELDS = [
  'Name',
  'Slug',
  'SKU',
  'Regular Price (USD)',
  'Sale Price (USD)',
  'Type',
  'Category',
  'Stock Status',
  'Stock',
  'Manage Stock',
  'Virtual',
  'Weight',
  'Length',
  'Width',
  'Height',
  'Author',
  'Total Sales',
  'Post Date',
  'Featured Image URL',
  'Featured Image Alt Text',
  'Short Description',
  'Description',
  'File URL',
  'Download Limit',
  'Download Expiry Days',
  'Is Featured',
  'Status',
  'Gallery Image URLs'
]

const DEFAULT_HEADER_MAP: Record<string, string[]> = {
  Name: ['post_title', 'title', 'Name'],
  Slug: ['post_name', 'slug'],
  SKU: ['sku', 'SKU'],
  'Regular Price (USD)': ['regular_price', 'regular_price_usd', 'price'],
  'Sale Price (USD)': ['sale_price', 'sale_price_usd'],
  Type: ['tax:product_type', 'type'],
  Category: ['tax:product_cat', 'product_cat', 'Categories', 'categories', 'Category'],
  'Stock Status': ['stock_status', 'Stock Status', 'In stock?'],
  Stock: ['stock', 'stock_quantity', 'Stock'],
  'Manage Stock': ['manage_stock', 'Manage Stock'],
  Virtual: ['virtual', 'Virtual', 'is_virtual'],
  Weight: ['weight', 'Weight', 'weight_kg'],
  Length: ['length', 'Length'],
  Width: ['width', 'Width'],
  Height: ['height', 'Height'],
  Author: ['attribute:pa_book-author', 'Author', 'book_author'],
  'Total Sales': ['meta:total_sales', 'Total Sales', 'total_sales'],
  'Post Date': ['post_date', 'Post Date'],
  'Featured Image URL': ['Featured Image URL', 'image_url', 'Featured Image', 'featured_image', 'Image', 'image', 'Image URL'],
  'Featured Image Alt Text': ['Featured Image Alt Text', 'image_alt', 'alt_text'],
  'Short Description': ['Short Description', 'short_description', 'post_excerpt', 'Excerpt'],
  Description: ['Description', 'description', 'post_content', 'Content'],
  'File URL': ['File URL', 'file_url', 'downloadable_files', 'Downloadable Files'],
  'Download Limit': ['Download Limit', 'download_limit'],
  'Download Expiry Days': ['Download Expiry Days', 'download_expiry', 'download_expiry_days'],
  'Is Featured': ['Is Featured', 'is_featured', 'Featured', 'featured', 'tax:product_visibility'],
  Status: ['Status', 'status', 'post_status'],
  'Gallery Image URLs': ['Gallery Image URLs', 'gallery_image_urls', 'Images', 'images', 'Gallery', 'gallery', 'Image', 'image', 'Gallery Images', 'gallery images']
}

function buildAutoMap(headers: string[]) {
  const normalizedHeaders = headers.map((header) => header.trim().toLowerCase())
  const map: Record<string, string> = {}
  MAPPABLE_FIELDS.forEach((field) => {
    const exactIndex = normalizedHeaders.findIndex((header) => header === field.toLowerCase())
    const foundHeader = exactIndex >= 0 ? headers[exactIndex] : ''
    if (foundHeader) {
      map[field] = foundHeader
      return
    }

    const aliases = DEFAULT_HEADER_MAP[field] || []
    const aliasHeader = aliases
      .map((alias) => alias.trim().toLowerCase())
      .map((alias) => normalizedHeaders.find((header) => header === alias))
      .find(Boolean)

    map[field] = aliasHeader || ''
  })
  return map
}

function remapRows(rows: any[], fieldMap: Record<string, string>) {
  return rows.map((row) => {
    const mappedRow: any = { ...row }
    Object.entries(fieldMap).forEach(([target, source]) => {
      if (source && row[source] !== undefined) {
        mappedRow[target] = row[source]
      }
    })
    return mappedRow
  })
}

export function ProductBulkActions({
  selectedCount = 0,
  onBulkDelete,
  onBulkDuplicate,
  onBulkIndex,
  actionsDisabled = false,
  onClearSelection,
}: ProductBulkActionsProps) {
  const [loading, setLoading] = React.useState(false)
  const [parseLoading, setParseLoading] = React.useState(false)
  const [fileName, setFileName] = React.useState('')
  const [csvHeaders, setCsvHeaders] = React.useState<string[]>([])
  const [csvRows, setCsvRows] = React.useState<any[]>([])
  const [fieldMap, setFieldMap] = React.useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = React.useState('')
  const [importLoading, setImportLoading] = React.useState(false)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage('')
    setParseLoading(true)
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParseLoading(false)
        if (results.errors.length > 0) {
          setErrorMessage('Failed to parse CSV. Please check the file format.')
          setCsvHeaders([])
          setCsvRows([])
          setFieldMap({})
          return
        }

        const rawHeaders = results.meta.fields || []
        const headers = rawHeaders.map((header) => String(header || '').trim())
        const normalizedRows = (results.data as any[]).map((row) => {
          const normalizedRow: Record<string, any> = {}
          Object.keys(row).forEach((key) => {
            normalizedRow[String(key || '').trim()] = row[key]
          })
          return normalizedRow
        })

        setCsvHeaders(headers)
        setCsvRows(normalizedRows)
        setFieldMap(buildAutoMap(headers))
      },
      error: () => {
        setParseLoading(false)
        setErrorMessage('Failed to read the CSV file. Please try again.')
      }
    })
  }

  const handleImport = async () => {
    if (csvRows.length === 0) {
      setErrorMessage('No CSV file loaded for import.')
      return
    }

    setImportLoading(true)
    const mappedRows = remapRows(csvRows, fieldMap)
    const res = await importProductsFromCSV(mappedRows)
    setImportLoading(false)

    if (res.error) {
      alert(res.error)
    } else {
      setFileName('')
      setCsvHeaders([])
      setCsvRows([])
      setFieldMap({})
      alert(`Successfully imported ${res.count} products.`)
      router.refresh()
    }
  }

  const downloadTemplate = () => {
    const headers = 'Name,Slug,SKU,Regular Price (USD),Sale Price (USD),Type,Category,Stock Status,Stock,Manage Stock,Virtual,Weight,Length,Width,Height,Author,Total Sales,Post Date,Featured Image URL,Featured Image Alt Text,Short Description,Description,File URL,Download Limit,Download Expiry Days,Is Featured,Status,Gallery Image URLs'
    const example = 'Deliverance Book,deliverance-book,DELIV001,15,10,digital,Books,instock,10,yes,yes,0.5,15,10,2,John Doe,32,2026-05-03,https://.../cover.jpg,Book cover alt,Short summary,Full product description,https://.../book.pdf,-1,-1,yes,published,https://.../cover.jpg|https://.../back.jpg'
    const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'product-import-template.csv'
    link.click()
  }

  const mappedPreviewRows = csvRows.slice(0, 3).map((row) => remapRows([row], fieldMap)[0])

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Template
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading || importLoading} className="gap-2">
            {parseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Choose File
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap items-center justify-end">
          {selectedCount > 0 && onBulkDuplicate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDuplicate}
              disabled={loading || importLoading || actionsDisabled}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Duplicate {selectedCount} selected
            </Button>
          )}
          {selectedCount > 0 && onBulkIndex && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkIndex}
              disabled={loading || importLoading || actionsDisabled}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              Index {selectedCount} in Google
            </Button>
          )}
          {selectedCount > 0 && onBulkDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              disabled={loading || importLoading || actionsDisabled}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete {selectedCount} selected
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleImport} disabled={csvRows.length === 0 || importLoading} className="gap-2">
            {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {fileName && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Selected file</p>
              <p className="text-xs text-muted-foreground">{fileName} — {csvRows.length} rows, {csvHeaders.length} columns</p>
            </div>
            <div className="text-xs text-muted-foreground">Select mappings before import</div>
          </div>

          {errorMessage ? (
            <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {MAPPABLE_FIELDS.map((field) => (
                  <div key={field} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{field}</p>
                    <Select
                      value={fieldMap[field] || ''}
                      onValueChange={(value) => setFieldMap((prev) => ({ ...prev, [field]: value || '' }))}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Map column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No mapping</SelectItem>
                        {csvHeaders.map((header) => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-muted p-4">
                <p className="text-sm font-semibold">Sample Preview</p>
                {mappedPreviewRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No preview available.</p>
                ) : (
                  <div className="overflow-x-auto mt-3">
                    <table className="min-w-full text-left text-xs">
                      <thead>
                        <tr>
                          {['Name', 'Slug', 'Category', 'Regular Price (USD)', 'Sale Price (USD)', 'Type', 'Featured Image URL', 'Gallery Image URLs', 'Is Featured'].map((col) => (
                            <th key={col} className="px-2 py-2 font-semibold text-muted-foreground border-b">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mappedPreviewRows.map((row, index) => (
                          <tr key={index} className="border-b last:border-b-0">
                            <td className="px-2 py-2">{row['Name'] || '-'}</td>
                            <td className="px-2 py-2">{row['Slug'] || '-'}</td>
                            <td className="px-2 py-2">{row['Category'] || '-'}</td>
                            <td className="px-2 py-2">{row['Regular Price (USD)'] || '-'}</td>
                            <td className="px-2 py-2">{row['Sale Price (USD)'] || '-'}</td>
                            <td className="px-2 py-2">{row['Type'] || '-'}</td>
                            <td className="px-2 py-2 break-all">{row['Featured Image URL'] || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
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
