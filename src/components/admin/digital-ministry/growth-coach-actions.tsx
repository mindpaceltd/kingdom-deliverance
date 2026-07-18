'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { generateGrowthReport } from '@/lib/digital-ministry/growth'
import { Loader2 } from 'lucide-react'

export function GrowthCoachActions() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  function run(period: 'daily' | 'weekly' | 'monthly') {
    setError(null)
    setOk(null)
    startTransition(async () => {
      const result = await generateGrowthReport(period)
      if ('error' in result) setError(result.error)
      else {
        setOk(`Saved ${period} report · score ${result.growth_score}`)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => run('daily')} disabled={pending}>
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
          Generate today&apos;s report
        </Button>
        <Button size="sm" variant="outline" onClick={() => run('weekly')} disabled={pending}>
          Weekly
        </Button>
        <Button size="sm" variant="outline" onClick={() => run('monthly')} disabled={pending}>
          Monthly
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {ok ? <p className="text-xs text-emerald-700">{ok}</p> : null}
    </div>
  )
}
