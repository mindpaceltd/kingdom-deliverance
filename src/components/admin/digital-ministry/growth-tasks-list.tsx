'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { updateAiTaskStatus } from '@/lib/digital-ministry/growth'
import { cn } from '@/lib/utils'
import { Check, ListTodo, Loader2, X } from 'lucide-react'

function priorityTone(priority: number) {
  if (priority >= 70) return 'border-red-200 bg-red-50 text-red-900'
  if (priority >= 40) return 'border-amber-200 bg-amber-50 text-amber-900'
  return 'border-border bg-muted text-muted-foreground'
}

export function GrowthTasksList({
  tasks,
}: {
  tasks: Array<{
    id: string
    title: string
    description: string | null
    priority: number
    difficulty: string | null
    expected_impact: string | null
    status: string
  }>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (!tasks.length) {
    return (
      <DmCard className="flex flex-col items-center px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
          <ListTodo className="size-5 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-semibold">No open coach tasks</p>
        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
          Generate today&apos;s Growth Coach report to create prioritized action items for the media
          team.
        </p>
      </DmCard>
    )
  }

  return (
    <ul className="space-y-3">
      {tasks.map((t) => (
        <li key={t.id}>
          <DmCard className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      priorityTone(t.priority)
                    )}
                  >
                    P{t.priority}
                  </span>
                  {t.difficulty ? (
                    <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.difficulty}
                    </span>
                  ) : null}
                  {t.expected_impact ? (
                    <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900">
                      {t.expected_impact}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{t.title}</p>
                {t.description ? (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await updateAiTaskStatus(t.id, 'done')
                      router.refresh()
                    })
                  }
                >
                  {pending ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 size-3.5" />
                  )}
                  Done
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await updateAiTaskStatus(t.id, 'dismissed')
                      router.refresh()
                    })
                  }
                >
                  <X className="mr-1.5 size-3.5" />
                  Dismiss
                </Button>
              </div>
            </div>
          </DmCard>
        </li>
      ))}
    </ul>
  )
}
