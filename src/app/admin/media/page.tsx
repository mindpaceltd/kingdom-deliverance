import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { MediaLibrarySkeleton } from '@/components/admin/media/media-library-skeleton'
import { getMediaLibraryPage } from '@/lib/actions/media'

const MediaLibrary = dynamic(
  () => import('@/components/admin/media-library').then((m) => ({ default: m.MediaLibrary })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-6 p-6">
        <MediaLibrarySkeleton count={18} />
      </div>
    ),
  }
)

async function MediaLibraryLoader() {
  const result = await getMediaLibraryPage({ page: 0 })

  if ('error' in result) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Media Library</h1>
        <p className="mt-4 text-sm text-destructive">Could not load media: {result.error}</p>
      </div>
    )
  }

  return (
    <MediaLibrary
      initialMedia={result.data}
      initialTotal={result.total}
      initialHasMore={result.hasMore}
    />
  )
}

export default function AdminMediaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 p-6">
          <div className="space-y-2">
            <div className="h-7 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
          <MediaLibrarySkeleton count={18} />
        </div>
      }
    >
      <MediaLibraryLoader />
    </Suspense>
  )
}
