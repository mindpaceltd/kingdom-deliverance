'use client'

import type { ContentGapMatrix } from '@/lib/digital-ministry/competitor-intelligence/types'
import { cn } from '@/lib/utils'

function cellIntensity(count: number, max: number) {
  if (!count) return 0
  return Math.min(1, count / Math.max(1, max))
}

function cellClass(intensity: number, isKdc: boolean) {
  if (intensity <= 0) return 'bg-muted/40 text-muted-foreground'
  if (isKdc) {
    if (intensity >= 0.66) return 'bg-teal-800 text-white'
    if (intensity >= 0.33) return 'bg-teal-600 text-white'
    return 'bg-teal-200 text-teal-950'
  }
  if (intensity >= 0.66) return 'bg-amber-700 text-white'
  if (intensity >= 0.33) return 'bg-amber-400 text-amber-950'
  return 'bg-amber-100 text-amber-950'
}

export function ContentGapMatrixHeatmap({
  matrix,
  compact = false,
  className,
}: {
  matrix: ContentGapMatrix
  compact?: boolean
  className?: string
}) {
  if (!matrix.topics.length || !matrix.columns.length) {
    return (
      <p className="text-xs text-muted-foreground">
        Run captures on peers to populate the content gap matrix.
      </p>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>Topic × ministry heatmap (30d KDC CMS vs latest captures)</span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded-sm bg-teal-700" /> KDC
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded-sm bg-amber-500" /> Peers
          </span>
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/80">
        <table className={cn('w-full min-w-[480px] border-collapse text-xs', compact && 'text-[10px]')}>
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="sticky left-0 z-10 bg-muted/30 px-2 py-2 text-left font-semibold">Topic</th>
              {matrix.columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    'px-2 py-2 text-center font-semibold',
                    col.isKdc ? 'text-teal-900' : 'text-amber-900',
                    compact ? 'max-w-[72px] truncate' : 'min-w-[64px]'
                  )}
                  title={col.label}
                >
                  {compact && col.label.length > 10 ? `${col.label.slice(0, 9)}…` : col.label}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground">Gap</th>
            </tr>
          </thead>
          <tbody>
            {matrix.topics.map((topic, ri) => {
              const gap = matrix.gapScores[ri] ?? 0
              const row = matrix.cells[ri] ?? []
              return (
                <tr key={topic} className="border-b border-border/50 last:border-0">
                  <td className="sticky left-0 z-10 bg-background px-2 py-1.5 font-medium">{topic}</td>
                  {row.map((count, ci) => {
                    const col = matrix.columns[ci]
                    const intensity = cellIntensity(count, matrix.maxCount)
                    return (
                      <td key={`${topic}-${col?.id ?? ci}`} className="p-0.5">
                        <div
                          className={cn(
                            'flex min-h-[28px] items-center justify-center rounded-md tabular-nums font-medium',
                            cellClass(intensity, col?.isKdc ?? false)
                          )}
                          title={`${col?.label ?? ''}: ${count} items`}
                        >
                          {count || '—'}
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-2 py-1.5 text-center tabular-nums">
                    <span
                      className={cn(
                        'inline-flex min-w-[2rem] justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        gap >= 25
                          ? 'bg-amber-100 text-amber-900'
                          : gap >= 10
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-emerald-50 text-emerald-800'
                      )}
                    >
                      {gap}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Gap % = highest peer topic share minus KDC share. Higher gap = peers publish more on that theme relative to
        KDC.
      </p>
    </div>
  )
}
