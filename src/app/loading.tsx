export default function Loading() {
  return (
    <div className="container px-4 py-20">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading content...</p>
      </div>
    </div>
  )
}
