'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { persistAnalyticsSnapshot } from '@/lib/digital-ministry/analytics'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'

export function AnalyticsCharts({
  series,
  platformMix,
}: {
  series: Array<{ date: string; sermonViews: number; posts: number; comments: number }>
  platformMix: Array<{ platform: string; count: number }>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const chartSeries = series.map((s) => ({
    ...s,
    label: s.date.slice(5),
  }))

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await persistAnalyticsSnapshot()
              router.refresh()
            })
          }
        >
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
          Save daily snapshot
        </Button>
      </div>

      <DmCard className="p-4 sm:p-5">
        <p className="mb-3 text-sm font-semibold">14-day activity</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartSeries}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="posts" name="Studio posts" stroke="#0f766e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="comments" name="Comments" stroke="#b45309" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </DmCard>

      <DmCard className="p-4 sm:p-5">
        <p className="mb-3 text-sm font-semibold">Platform mix (Studio drafts)</p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformMix.length ? platformMix : [{ platform: 'none', count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#134e4a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DmCard>
    </div>
  )
}
