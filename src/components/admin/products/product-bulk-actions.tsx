'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload, Loader2, FileSpreadsheet, Copy } from 'lucide-react'
import { exportProductsToCSV, importProductsFromCSV } from '@/lib/actions/bulk-products'
import { duplicateProduct } from '@/lib/actions/products'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MAPPABLE_FIELDS = [
  'Name',
  'Slug',
  'Regular Price (USD)',
  'Sale Price (USD)',
  'Type',
  'Category',
  'Stock Status',
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

const DEFAULT_HEADER_MAP: Record<string, string> = {
  Name: 'post_title',
  Slug: 'post_name',
  'Regular Price (USD)': 'regular_price',
  'Sale Price (USD)': 'sale_price',
  Type: 'tax:product_type',
  Category: 'tax:product_cat',
  'Stock Status': 'stock_status',
  'Featured Image URL': 'images',
  'Featured Image Alt Text': 'image_alt',
  'Short Description': 'post_excerpt',
  Description: 'post_content',
  'File URL': 'downloadable_files',
  'Download Limit': 'download_limit',
  'Download Expiry Days': 'download_expiry',
  'Is Featured': 'tax:product_visibility',
  Status: 'post_status',
  'Gallery Image URLs': 'images'
}

function buildAutoMap(headers: string[]) {
  const map: Record<string, string> = {}
  MAPPABLE_FIELDS.forEach((field) => {
    const defaultHeader = DEFAULT_HEADER_MAP[field]
    const exact = headers.find((header) => header.toLowerCase() === field.toLowerCase())
    const alias = defaultHeader ? headers.find((header) => header.toLowerCase() === defaultHeader.toLowerCase()) : undefined
    map[field] = exact || alias || ''
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

export function ProductBulkActions() {
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

        const headers = results.meta.fields || []
        setCsvHeaders(headers)
        setCsvRows(results.data as any[])
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
    const headers = 'Name,Slug,Regular Price (USD),Sale Price (USD),Type,Category,Stock Status,Featured Image URL,Featured Image Alt Text,Short Description,Description,File URL,Download Limit,Download Expiry Days,Is Featured,Status,Gallery Image URLs'
    const example = 'Deliverance Book,deliverance-book,15,10,digital,Books,instock,https://.../cover.jpg,Book cover alt,Short summary,Full product description,https://.../book.pdf,-1,-1,yes,published,https://.../cover.jpg|https://.../back.jpg'
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
        <Button variant="secondary" size="sm" onClick={handleImport} disabled={csvRows.length === 0 || importLoading} className="gap-2">
          {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Import
        </Button>
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
                      onValueChange={(value) => setFieldMap((prev) => ({ ...prev, [field]: value }))}
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
                          {['Name', 'Slug', 'Category', 'Regular Price (USD)', 'Sale Price (USD)', 'Type', 'Featured Image URL'].map((col) => (
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
