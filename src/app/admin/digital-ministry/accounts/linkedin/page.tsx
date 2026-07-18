import { DmModulePlaceholder } from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {
  return (
    <DmModulePlaceholder
      title="LinkedIn"
      description="Account health, permissions, token expiry, and publish capability for LinkedIn."
      bullets={[
        'Connection status and OAuth scopes',
        'Token refresh and health checks',
        'Analytics sync + publish / manual fallback',
      ]}
      links={[
        { href: '/admin/digital-ministry/accounts', label: 'All accounts' },
        { href: '/admin/analytics', label: 'Google / YouTube analytics' },
      ]}
    />
  )
}
