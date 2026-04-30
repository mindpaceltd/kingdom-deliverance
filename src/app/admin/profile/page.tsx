import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/admin/profile/profile-form'
import type { Profile } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/admin/login')

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Update your personal information, avatar, and password.
        </p>
      </div>
      <ProfileForm
        profile={profile as Profile}
        email={user.email ?? ''}
      />
    </div>
  )
}
