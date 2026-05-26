import dynamic from 'next/dynamic'
import { PageEditorSkeleton } from '@/components/admin/pages/pages-admin-skeleton'

const PageEditorClient = dynamic(
  () =>
    import('@/components/admin/pages/page-editor-client').then((m) => ({
      default: m.PageEditorClient,
    })),
  { ssr: false, loading: () => <PageEditorSkeleton /> }
)

export default function NewAdminPage() {
  return <PageEditorClient />
}
