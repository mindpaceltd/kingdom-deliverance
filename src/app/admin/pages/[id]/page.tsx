import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { PageEditorSkeleton } from '@/components/admin/pages/pages-admin-skeleton'
import { getAdminPage } from '@/lib/actions/pages'
import type { CmsPage } from '@/lib/types'

const PageEditorClient = dynamic(
  () =>
    import('@/components/admin/pages/page-editor-client').then((m) => ({
      default: m.PageEditorClient,
    })),
  { ssr: false, loading: () => <PageEditorSkeleton /> }
)

export default async function EditAdminPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getAdminPage(params.id)

  if ('error' in result) {
    notFound()
  }

  return <PageEditorClient page={result.data as CmsPage} />
}
