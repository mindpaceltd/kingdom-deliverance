import Link from 'next/link'
import { listCalendarMonth } from '@/lib/digital-ministry/posts'
import { DmCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: { y?: string; m?: string }
}) {
  const now = new Date()
  const year = Number(searchParams?.y) || now.getFullYear()
  const month = Number(searchParams?.m) || now.getMonth() + 1

  const entries = await listCalendarMonth(year, month)
  const byDate = new Map<string, typeof entries>()
  for (const e of entries) {
    const list = byDate.get(e.entry_date) ?? []
    list.push(e)
    byDate.set(e.entry_date, list)
  }

  const first = new Date(Date.UTC(year, month - 1, 1))
  const startPad = first.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  const prev = new Date(Date.UTC(year, month - 2, 1))
  const next = new Date(Date.UTC(year, month, 1))

  const cells: ({ day: number; date: string } | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, date })
  }

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Content Calendar"
        description="Scheduled Digital Ministry posts land here when you Schedule from Content Studio."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`?y=${prev.getUTCFullYear()}&m=${prev.getUTCMonth() + 1}`}>Prev</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`?y=${next.getUTCFullYear()}&m=${next.getUTCMonth() + 1}`}>Next</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/digital-ministry/studio">New post</Link>
            </Button>
          </div>
        }
      />

      <p className="text-sm font-medium">{monthLabel(year, month)}</p>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:gap-2 sm:text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`pad-${idx}`} className="min-h-[72px] rounded-lg bg-muted/20 sm:min-h-[96px]" />
          }
          const dayEntries = byDate.get(cell.date) ?? []
          return (
            <DmCard
              key={cell.date}
              className={cn(
                'min-h-[72px] p-1.5 sm:min-h-[96px] sm:p-2',
                dayEntries.length ? 'border-teal-200/80' : ''
              )}
            >
              <p className="text-[11px] font-semibold tabular-nums text-muted-foreground">{cell.day}</p>
              <ul className="mt-1 space-y-1">
                {dayEntries.slice(0, 3).map((e) => (
                  <li key={e.id}>
                    {e.dm_post_id ? (
                      <Link
                        href={`/admin/digital-ministry/studio/${e.dm_post_id}`}
                        className="block truncate rounded px-1 py-0.5 text-[10px] leading-tight text-foreground hover:bg-muted sm:text-xs"
                        style={{ borderLeft: `3px solid ${e.color || '#0f766e'}` }}
                      >
                        {e.title}
                      </Link>
                    ) : (
                      <span className="block truncate px-1 text-[10px] sm:text-xs">{e.title}</span>
                    )}
                  </li>
                ))}
                {dayEntries.length > 3 ? (
                  <li className="px-1 text-[10px] text-muted-foreground">+{dayEntries.length - 3} more</li>
                ) : null}
              </ul>
            </DmCard>
          )
        })}
      </div>

      {!entries.length ? (
        <p className="text-sm text-muted-foreground">
          No scheduled items this month. Schedule a draft from Content Studio to populate the calendar.
        </p>
      ) : null}
    </div>
  )
}
