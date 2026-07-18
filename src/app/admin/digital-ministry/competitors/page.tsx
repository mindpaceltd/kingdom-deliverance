import { DmModulePlaceholder } from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {
  return (
    <DmModulePlaceholder
      title="Competitor Intelligence"
      description="Track peer ministries using public signals only — no scraping of private data."
      bullets={[
          'Add competitors (Watoto, Phaneroo, Elevation, etc.)',
          'Followers, posting frequency, themes, title patterns',
          'AI comparison: what they do better / what KDC does better'
      ]}
    />
  )
}
