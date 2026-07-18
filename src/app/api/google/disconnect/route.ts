import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// DELETE /api/google/disconnect
export async function DELETE() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await supabase.from('users_google_integrations').delete().eq('user_id', user.id)
    await supabase.from('analytics_config').delete().eq('user_id', user.id)
    await supabase.from('search_console_config').delete().eq('user_id', user.id)

    const admin = createAdminClient()
    const now = new Date().toISOString()
    await admin
      .from('dm_social_accounts')
      .update({
        status: 'disconnected',
        health_status: 'unknown',
        health_message: 'Google disconnected',
        token_encrypted: null,
        refresh_token_encrypted: null,
        deleted_at: now,
        updated_at: now,
      })
      .in('platform', ['youtube', 'website'])
      .eq('connected_by', user.id)
      .is('deleted_at', null)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Disconnect failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
