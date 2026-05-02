'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface ColumnDef<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  searchPlaceholder?: string
  filterSlot?: React.ReactNode
  pageSize?: number
  onSearch?: (query: string) => void
  searchValue?: string
  hideSearch?: boolean
  className?: string
  isLoading?: boolean
}

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_BUTTONS = 5

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  filterSlot,
  pageSize = DEFAULT_PAGE_SIZE,
  onSearch,
  searchValue,
  hideSearch = false,
  className,
  isLoading = false,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="rounded-md border bg-background p-6 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      </div>
    )
  }

  const [internalSearch, setInternalSearch] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)

  // Use controlled search value if provided, otherwise use internal state
  const searchQuery = searchValue !== undefined ? searchValue : internalSearch

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (onSearch) {
      onSearch(value)
    } else {
      setInternalSearch(value)
      setCurrentPage(1) // Reset to first page on search
    }
  }

  // Client-side filtering when no external search handler is provided
  const filteredData = React.useMemo(() => {
    if (onSearch || !searchQuery.trim()) return data

    const query = searchQuery.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const cellContent = col.cell(row)
        // Convert cell content to string for searching
        const cellText = getCellText(cellContent)
        return cellText.toLowerCase().includes(query)
      })
    )
  }, [data, searchQuery, columns, onSearch])

  // Reset to page 1 when filtered data changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filteredData.length])

  const totalItems = filteredData.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const pageData = filteredData.slice(startIndex, endIndex)

  const pageNumbers = getPageNumbers(safePage, totalPages)

  return (
    <div className={cn('space-y-4', className)}>
      {!hideSearch && (
        <div className="flex items-center gap-2">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className="max-w-sm"
          />
          {filterSlot && <div className="flex items-center gap-2">{filterSlot}</div>}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>
            Showing {startIndex + 1}–{endIndex} of {totalItems} results
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              Previous
            </Button>

            {pageNumbers.map((page, i) =>
              page === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2">
                  …
                </span>
              ) : (
                <Button
                  key={page}
                  variant={safePage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page as number)}
                >
                  {page}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper: extract plain text from a React node for client-side search
function getCellText(node: React.ReactNode): string {
  if (node === null || node === undefined) return ''
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(getCellText).join(' ')
  }
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>
    return getCellText(element.props.children)
  }
  return ''
}

// Helper: compute page number buttons with ellipsis
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= MAX_PAGE_BUTTONS) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []
  const half = Math.floor(MAX_PAGE_BUTTONS / 2)

  let start = Math.max(1, current - half)
  const end = Math.min(total, start + MAX_PAGE_BUTTONS - 1)

  // Adjust start if end is capped
  if (end - start < MAX_PAGE_BUTTONS - 1) {
    start = Math.max(1, end - MAX_PAGE_BUTTONS + 1)
  }

  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('...')
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (end < total) {
    if (end < total - 1) pages.push('...')
    pages.push(total)
  }

  return pages
}
