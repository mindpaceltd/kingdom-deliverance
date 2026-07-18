'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { updateAiTaskStatus } from '@/lib/digital-ministry/growth'

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
      <DmCard className="p-5 text-sm text-muted-foreground">
        No open coach tasks yet. Generate today&apos;s Growth Coach report to create action items.
      </DmCard>
    )
  }

  return (
    <DmCard className="p-5">
      <p className="text-sm font-semibold">Open coach tasks</p>
      <ul className="mt-3 space-y-3">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex flex-col gap-2 rounded-xl border border-border/60 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium">{t.title}</p>
              {t.description ? (
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
              ) : null}
              <p className="mt-1 text-[11px] text-muted-foreground">
                Priority {t.priority}
                {t.difficulty ? ` · ${t.difficulty}` : ''}
                {t.expected_impact ? ` · ${t.expected_impact}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await updateAiTaskStatus(t.id, 'done')
                    router.refresh()
                  })
                }
              >
                Done
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await updateAiTaskStatus(t.id, 'dismissed')
                    router.refresh()
                  })
                }
              >
                Dismiss
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </DmCard>
  )
}
