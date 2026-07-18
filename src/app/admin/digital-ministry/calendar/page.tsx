import { DmModulePlaceholder } from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {
  return (
    <DmModulePlaceholder
      title="Content Calendar"
      description="Monthly drag-and-drop calendar with campaigns, approvals, and AI gap suggestions."
      bullets={[
          'Color-coded entries tied to dm_calendar_entries',
          'Recurring posts and approval workflow',
          'AI suggests missing content slots for the week'
      ]}
    />
  )
}
