import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getAuthedGoogleClient } from '@/lib/google/client';

// GET /api/google/analytics/accounts
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const auth = await getAuthedGoogleClient(user.id);
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth });

    const { data } = await analyticsAdmin.accounts.list();
    return NextResponse.json({ accounts: data.accounts || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
