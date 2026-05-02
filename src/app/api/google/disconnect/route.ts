import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/google/disconnect
export async function DELETE() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await supabase.from('users_google_integrations').delete().eq('user_id', user.id);
    await supabase.from('analytics_config').delete().eq('user_id', user.id);
    await supabase.from('search_console_config').delete().eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
