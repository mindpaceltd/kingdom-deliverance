import { notFound } from 'next/navigation'
import { getDmPost } from '@/lib/digital-ministry/posts'
import { DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { DmPostEditor } from '@/components/admin/digital-ministry/dm-post-editor'

export default async function StudioEditPage({ params }: { params: { id: string } }) {
  const { post, publications } = await getDmPost(params.id)
  if (!post) notFound()

  return (
    <div className="space-y-6">
      <DmPageHeader
        title={post.title || 'Edit draft'}
        description="Adapt once for multiple platforms. AI rewrite keeps KDC tone — never generic filler."
      />
      <DmPostEditor post={post} publications={publications} />
    </div>
  )
}
