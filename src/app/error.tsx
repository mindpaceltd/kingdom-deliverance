'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container px-4 py-20">
      <div className="mx-auto max-w-xl rounded-lg border bg-card p-6 text-center">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not load this page right now. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
