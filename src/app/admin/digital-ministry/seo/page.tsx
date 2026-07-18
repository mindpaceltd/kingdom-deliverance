import { DmModulePlaceholder } from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {
  return (
    <DmModulePlaceholder
      title="SEO Center"
      description="Audit pages, meta, schema, internal links, Core Web Vitals, and keyword opportunities."
      bullets={[
          'Builds on existing post/sermon SEO panels and /admin/seo-tools',
          'Stores audits in dm_seo_audits'
      ]}
      links={
[
          { href: '/admin/seo-tools', label: 'SEO Tools' },
          { href: '/admin/posts', label: 'Posts SEO' }
      ]}
    />
  )
}
