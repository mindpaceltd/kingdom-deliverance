'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { generateGrowthReport } from '@/lib/digital-ministry/growth'
import { cn } from '@/lib/utils'
import { Loader2, Sparkles } from 'lucide-react'

export function GrowthCoachActions() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [active, setActive] = useState<'daily' | 'weekly' | 'monthly' | null>(null)

  function run(period: 'daily' | 'weekly' | 'monthly') {
    setError(null)
    setOk(null)
    setActive(period)
    startTransition(async () => {
      try {
        const result = await generateGrowthReport(period)
        if ('error' in result) setError(result.error)
        else {
          setOk(`Saved ${period} report · score ${result.growth_score}%`)
          router.refresh()
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Report failed')
      } finally {
        setActive(null)
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => run('daily')} disabled={pending}>
          {pending && active === 'daily' ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 size-3.5" />
          )}
          Generate today&apos;s report
        </Button>
        <Button size="sm" variant="outline" onClick={() => run('weekly')} disabled={pending}>
          {pending && active === 'weekly' ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : null}
          Weekly
        </Button>
        <Button size="sm" variant="outline" onClick={() => run('monthly')} disabled={pending}>
          {pending && active === 'monthly' ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : null}
          Monthly
        </Button>
      </div>
      {(error || ok) && (
        <p
          className={cn(
            'text-xs',
            error ? 'text-destructive' : 'text-emerald-700'
          )}
        >
          {error ?? ok}
        </p>
      )}
    </div>
  )
}
