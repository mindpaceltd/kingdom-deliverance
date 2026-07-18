import { DmModulePlaceholder } from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {
  return (
    <DmModulePlaceholder
      title="Community"
      description="Unified comment inbox with prayer / question / spam categories and AI draft replies."
      bullets={[
          'Sentiment: positive, neutral, negative, urgent',
          'Admin approve before send',
          'Sources: social + website when connectors are enabled'
      ]}
    />
  )
}
