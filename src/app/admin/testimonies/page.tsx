import type { Metadata } from 'next'
import { TestimoniesManager } from '@/components/admin/testimonies/testimonies-manager'
import { getTestimoniesForAdmin } from '@/lib/actions/testimonies'

export const metadata: Metadata = {
  title: 'Testimonies | KDC Admin',
  description: 'Review and publish member testimonies for Kingdom Deliverance Centre Uganda.',
}

export default async function AdminTestimoniesPage() {
  const result = await getTestimoniesForAdmin()

  if ('error' in result) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Testimonies</h2>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Could not load testimonies: {result.error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Testimonies</h2>
        <p className="text-sm text-muted-foreground">
          Review submissions from the public form and publish them to the website.
        </p>
      </div>
      <TestimoniesManager initialTestimonies={result.data} />
    </div>
  )
}
