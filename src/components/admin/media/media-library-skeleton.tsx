export function MediaLibrarySkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-lg bg-muted-foreground/10"
        />
      ))}
    </div>
  )
}
