import { DmModulePlaceholder } from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {
  return (
    <DmModulePlaceholder
      title="Website Analytics"
      description="Visitors, conversions, top pages, prayer, donations, and funnels."
      bullets={[
          'Uses existing Google Analytics + Search Console integration',
          'Own event tracking for prayer, give, newsletter CTAs'
      ]}
      links={
[
          { href: '/admin/analytics', label: 'Google Analytics setup' }
      ]}
    />
  )
}
