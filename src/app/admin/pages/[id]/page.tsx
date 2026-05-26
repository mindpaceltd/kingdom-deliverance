import { notFound } from 'next/navigation'
import { PageEditorClient } from '@/components/admin/pages/page-editor-client'
import { getAdminPage } from '@/lib/actions/pages'
import type { CmsPage } from '@/lib/types'

export default async function EditAdminPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getAdminPage(params.id)

  if ('error' in result) {
    notFound()
  }

  return (
    <div className="p-6">
      <PageEditorClient page={result.data as CmsPage} />
    </div>
  )
}
