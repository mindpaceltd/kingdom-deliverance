import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UsersManager, type UserRow } from '@/components/admin/users/users-manager'
import type { Profile, UserRole } from '@/lib/types'

export default async function AdminUsersPage() {
  const supabase = createClient()

  // Verify current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Not authenticated.</p>
      </div>
    )
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!currentProfile || (currentProfile.role as UserRole) !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-destructive">Not Authorised</h1>
        <p className="text-sm text-muted-foreground mt-1">
          You do not have permission to manage users.
        </p>
      </div>
    )
  }

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch auth users to get emails
  const adminClient = createAdminClient()
  const { data: authData } = await adminClient.auth.admin.listUsers()
  const authUsers = authData?.users ?? []

  // Build email map: userId → email
  const emailMap = new Map<string, string>()
  for (const authUser of authUsers) {
    if (authUser.email) emailMap.set(authUser.id, authUser.email)
  }

  // Merge profiles with emails
  const userRows: UserRow[] = (profiles as Profile[] ?? []).map((profile) => ({
    ...profile,
    email: emailMap.get(profile.id) ?? null,
  }))

  return (
    <UsersManager
      initialUsers={userRows}
      currentUserId={user.id}
    />
  )
}
