import { DmModulePlaceholder } from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {
  return (
    <DmModulePlaceholder
      title="Content Studio"
      description="Create once. Publish everywhere — Facebook, Instagram, YouTube, Shorts, TikTok, X, LinkedIn, blog, newsletter, and more."
      bullets={[
          'Rich text + markdown editor with media library, Bible verse search, hashtags, CTAs',
          'AI rewrite tones: Professional, Youth, Evangelism, Prayer, Leadership, and more',
          'Per-platform adaptations with manual publish fallback where APIs are restricted'
      ]}
      links={
[
          { href: '/admin/media', label: 'Media Library' },
          { href: '/admin/posts/new', label: 'New Blog Post' }
      ]}
    />
  )
}
