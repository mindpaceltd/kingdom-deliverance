import { Loader2 } from 'lucide-react'

export function PagesListSkeleton() {
  return (
    <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
      <Loader2 className="size-8 animate-spin" aria-hidden />
      <span className="sr-only">Loading pages…</span>
    </div>
  )
}

export function PageEditorSkeleton() {
  return (
    <div className="flex min-h-[480px] items-center justify-center text-muted-foreground">
      <Loader2 className="size-8 animate-spin" aria-hidden />
      <span className="sr-only">Loading page editor…</span>
    </div>
  )
}
